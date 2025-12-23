// geminiService.ts
import { GoogleGenAI, Type, Schema, Part } from "@google/genai";
import { ResumeData, ResumeConfig, FileInput } from "../types";

/* -------------------- Gemini client -------------------- */
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/* -------------------- retry/backoff + quota helpers -------------------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getErrCode(err: any) {
  return err?.error?.code ?? err?.status ?? err?.code;
}

function getErrMessage(err: any) {
  return String(err?.error?.message || err?.message || "");
}

/**
 * Extract retryDelay like "22s" from Gemini error details (RetryInfo)
 */
function getRetryDelayMs(err: any): number | null {
  const details = err?.error?.details;
  if (!Array.isArray(details)) return null;

  const retryInfo = details.find((d: any) => typeof d?.retryDelay === "string");
  const s = retryInfo?.retryDelay as string | undefined;
  if (!s) return null;

  const m = s.match(/^(\d+(?:\.\d+)?)s$/); // "22s" or "0.5s"
  if (!m) return null;

  return Math.ceil(parseFloat(m[1]) * 1000);
}

function isRetryable(err: any) {
  const code = getErrCode(err);
  const msg = getErrMessage(err);

  return (
    code === 429 ||
    code === 503 ||
    /overloaded|unavailable|rate limit|quota|too many requests|resource_exhausted|429|503/i.test(
      msg
    )
  );
}

/**
 * Detect "daily / plan quota exhausted" vs transient 429.
 * (Free-tier daily cap often looks like: generate_content_free_tier_requests, limit: 20)
 */
function isHardQuotaExhausted(err: any) {
  const msg = getErrMessage(err);
  return (
    /generate_content_free_tier_requests/i.test(msg) ||
    /GenerateRequestsPerDay/i.test(msg) ||
    (/quota exceeded/i.test(msg) && /per day|daily/i.test(msg))
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const lastAttempt = attempt === retries;

      // Hard daily quota -> don't hammer retries
      if (isHardQuotaExhausted(err)) throw err;

      if (!isRetryable(err) || lastAttempt) throw err;

      // Prefer server-provided retryDelay
      const serverDelay = getRetryDelayMs(err);
      if (serverDelay) {
        await sleep(serverDelay + Math.floor(Math.random() * 250));
        continue;
      }

      // exponential backoff + jitter
      const baseDelay = Math.min(20000, 800 * Math.pow(2, attempt)); // 0.8s,1.6,3.2,6.4,12.8...
      const jitter = Math.floor(Math.random() * 400);
      await sleep(baseDelay + jitter);
    }
  }
  throw new Error("AI_RETRY_FAILED");
}

/* -------------------- Concurrency guard (prevents spam calls) -------------------- */
let inFlightCount = 0;
const MAX_IN_FLIGHT = 1;

async function withInFlightGuard<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlightCount >= MAX_IN_FLIGHT) {
    throw new Error("AI_CALL_IN_PROGRESS");
  }
  inFlightCount++;
  try {
    return await fn();
  } finally {
    inFlightCount--;
  }
}

/* -------------------- Lightweight caching (support/Q&A mode) -------------------- */
type UnifiedChatResult = {
  text: string;
  proposal?: {
    data: ResumeData;
    description: string;
    metadata: {
      source: "ai";
      improvedSections: string[];
    };
  };
};

type CacheEntry = { at: number; value: UnifiedChatResult };
const SUPPORT_CACHE = new Map<string, CacheEntry>();
const SUPPORT_CACHE_TTL_MS = 60_000; // 1 min

function cacheKey(history: { role: string; text: string }[], text: string) {
  return JSON.stringify({ history, text });
}

function getCachedSupport(key: string): UnifiedChatResult | null {
  const hit = SUPPORT_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > SUPPORT_CACHE_TTL_MS) {
    SUPPORT_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedSupport(key: string, value: UnifiedChatResult) {
  SUPPORT_CACHE.set(key, { at: Date.now(), value });
}

/* -------------------- Schema -------------------- */
const RESUME_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    fullName: { type: Type.STRING },
    contactInfo: { type: Type.STRING, description: "Format: Email | Phone | LinkedIn" },
    location: { type: Type.STRING },
    summary: { type: Type.STRING },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Top skills relevant to the job",
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          website: {
            type: Type.STRING,
            description: "The official website domain of the company (e.g. 'google.com'). Guess if unknown.",
          },
          duration: { type: Type.STRING },
          points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Bullet points focusing on impact and metrics",
          },
        },
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          school: { type: Type.STRING },
          website: {
            type: Type.STRING,
            description: "The official website domain of the school (e.g. 'harvard.edu'). Guess if unknown.",
          },
          year: { type: Type.STRING },
        },
      },
    },
  },
  required: ["fullName", "summary", "skills", "experience"],
};

/* -------------------- Helper: Text or PDF Part -------------------- */
const getContentPart = (input: FileInput): Part => {
  if (input.type === "file" && input.mimeType && input.content) {
    const base64Data = input.content.split(",")[1] || input.content; // strip data: prefix if present
    return {
      inlineData: { mimeType: input.mimeType, data: base64Data },
    };
  }
  return { text: input.content };
};

/* -------------------- Base Resume Parsing -------------------- */
export const parseBaseResume = async (baseInput: FileInput): Promise<ResumeData> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `
You are an expert data extraction assistant.
Your task is to extract structured data from a raw resume (text or PDF).
Do not rewrite or embellish the content yet. Keep it as close to the original as possible while formatting it cleanly.
If dates are ambiguous, infer standard formats (e.g., "Jan 2020 - Present").
Standardize the "skills" list into a clean array of strings.
IMPORTANT: Infer the 'website' domain for every company and university (e.g. 'microsoft.com', 'stanford.edu') so logos can be fetched.
  `.trim();

  const contentPart = getContentPart(baseInput);

  const response = await withInFlightGuard(() =>
    withRetry(() =>
      ai.models.generateContent({
        model,
        contents: {
          parts: [contentPart, { text: "Extract the data into the specified JSON format." }],
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: RESUME_SCHEMA,
        },
      })
    )
  );

  if (!response.text) throw new Error("No response generated from AI");
  return JSON.parse(response.text) as ResumeData;
};

/* -------------------- Tailored Resume Generation -------------------- */
export const generateTailoredResume = async (
  baseResumeData: ResumeData,
  jobDescriptionInput: FileInput | null,
  config: ResumeConfig
): Promise<ResumeData> => {
  const model = "gemini-2.5-flash";

  let toneInstruction = "";
  switch (config.tone) {
    case "corporate":
      toneInstruction =
        "Use highly professional, executive-level language. Focus on ROI, strategic impact, and formal business terminology. Avoid casual phrasing.";
      break;
    case "creative":
      toneInstruction =
        "Use engaging, innovative, and energetic language. Show personality. Focus on creativity, adaptability, and fresh perspectives.";
      break;
    default:
      toneInstruction = "Use a standard, balanced professional tone suitable for most industries.";
  }

  let lengthInstruction = "";
  switch (config.length) {
    case "concise":
      lengthInstruction =
        "Keep it extremely concise. Summary should be under 3 sentences. Limit experience to the 3 most recent/relevant roles with max 3 bullet points each. Focus only on the absolute highlights.";
      break;
    case "detailed":
      lengthInstruction =
        "Provide a comprehensive detailed overview. Elaborate on projects in the summary. Include up to 5-6 bullet points per role, detailing specific methodologies and outcomes.";
      break;
    default:
      lengthInstruction = "Standard length. Summary approx 4-5 sentences. 3-5 bullet points per relevant role.";
  }

  let refinementInstruction = "";
  if (config.refinementLevel <= 20) {
    refinementInstruction =
      "STRICTLY PRESERVE ORIGINAL PHRASING. Only fix grammatical errors or major formatting issues. Do not sound like an AI. Keep the user's original voice.";
  } else if (config.refinementLevel <= 60) {
    refinementInstruction =
      "Polish the resume for clarity and professionalism. Improve awkward sentences but keep the original meaning and tone intact. Avoid over-optimizing.";
  } else {
    refinementInstruction =
      "COMPLETELY REWRITE for maximum impact. Use strong action verbs and persuasive language. Optimize heavily for ATS keywords. It is acceptable to sound very polished.";
  }

  const isRefinementOnly =
    !jobDescriptionInput || (!jobDescriptionInput.content && jobDescriptionInput.type === "text");

  const systemInstruction = `
You are an expert resume strategist.
Your task is to take existing resume data and rewrite it based on specific constraints.

CONFIGURATION:
Tone: ${toneInstruction}
Length: ${lengthInstruction}
Rewriting Intensity: ${refinementInstruction}
Target Language: ${config.language}

TASK:
${
  isRefinementOnly
    ? "The user wants to refine the style, length, and language of their current resume without targeting a specific job. Maintain the core information but adjust the phrasing, detail level, and language."
    : "The user wants to tailor this resume to a specific Job Description. Prioritize experience and skills that match the JD keywords."
}

CRITICAL: Translate all content values (summary, roles, descriptions, skills, etc.) into ${config.language}.
However, you MUST keep the JSON keys (fullName, experience, role, company, etc.) in English as defined in the schema.

Ensure you preserve the 'website' fields for companies and schools in the output.
Ensure the output strictly follows the JSON schema.
  `.trim();

  const parts: Part[] = [{ text: `CURRENT RESUME JSON: ${JSON.stringify(baseResumeData)}` }];

  if (!isRefinementOnly && jobDescriptionInput) {
    parts.push({ text: "TARGET JOB DESCRIPTION:" });
    parts.push(getContentPart(jobDescriptionInput));
  }

  const response = await withInFlightGuard(() =>
    withRetry(() =>
      ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: RESUME_SCHEMA,
        },
      })
    )
  );

  if (!response.text) throw new Error("No response generated from AI");
  return JSON.parse(response.text) as ResumeData;
};

/* -------------------- Chat-driven Resume Update -------------------- */
export const updateResumeWithChat = async (
  currentData: ResumeData,
  userPrompt: string
): Promise<{ data: ResumeData; description: string }> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `
You are an intelligent resume editor.
The user will provide their current resume data (JSON) and a request to modify it.

Your task is to:
1. Perform the requested modification (add, delete, edit, rephrase) on the JSON data.
2. Provide a very brief (1 sentence) description of what you changed.

Do not lose any existing data unless explicitly asked to remove it.
Preserve 'website' fields.
  `.trim();

  const prompt = `
CURRENT DATA:
${JSON.stringify(currentData)}

USER REQUEST:
${userPrompt}
  `.trim();

  const response = await withInFlightGuard(() =>
    withRetry(() =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              data: RESUME_SCHEMA,
              description: {
                type: Type.STRING,
                description:
                  "Brief description of changes made, e.g., 'Added Python to skills' or 'Rewrote summary'.",
              },
            },
            required: ["data", "description"],
          },
        },
      })
    )
  );

  if (!response.text) throw new Error("No response generated from AI");
  return JSON.parse(response.text) as { data: ResumeData; description: string };
};

/* -------------------- Unified Chat Agent -------------------- */
export async function unifiedChatAgent(
  history: { role: "user" | "model" | "assistant"; text: string }[],
  text: string,
  currentResumeData: ResumeData | null
): Promise<UnifiedChatResult> {
  const model = "gemini-2.5-flash";

  // 🟡 No resume loaded → Support / Q&A Mode
  if (!currentResumeData) {
    const systemInstruction = `
You are the expert AI support assistant for OneClickCVPro.
Your role is to answer questions about the app, features, pricing, and general resume advice.

Key Info:
- Users build resumes in the 'Editor'.
- They manage saved resumes in the 'Dashboard'.
- 'Credits' are used for AI tailoring (1 credit) and PDF downloads (1 credit).
- If a user wants to edit their resume, tell them to open it in the Editor first.

Be helpful, brief, and friendly. Do not hallucinate features.
    `.trim();

    const key = cacheKey(history, text);
    const cached = getCachedSupport(key);
    if (cached) return cached;

    try {
      const response = await withInFlightGuard(() =>
        withRetry(() =>
          ai.models.generateContent({
            model,
            config: { systemInstruction },
            contents: history.map((m) => ({
              // Map 'assistant' -> 'model' for Gemini API
              role: m.role === "assistant" || m.role === "model" ? "model" : "user",
              parts: [{ text: m.text }],
            })),
          })
        )
      );

      const result: UnifiedChatResult = {
        text: response.text || "I'm sorry, I couldn't generate a response.",
      };
      setCachedSupport(key, result);
      return result;
    } catch (err: any) {
      console.error("Support Chat Error:", err);

      if (isHardQuotaExhausted(err)) {
        return {
          text: "Daily AI quota reached for this project. Please try again tomorrow or upgrade your AI plan.",
        };
      }

      const msg = getErrMessage(err);
      if (/AI_CALL_IN_PROGRESS/i.test(msg)) {
        return { text: "One second — I'm already working on your last request." };
      }
      if (/overloaded|503|unavailable|429|rate limit|quota/i.test(msg)) {
        return { text: "I'm getting rate-limited right now 😅 Please try again in a moment." };
      }

      return { text: "I'm having trouble connecting to the support brain right now. Please try again." };
    }
  }

  // 🔵 Resume Loaded → Edit Mode
  try {
    const result = await updateResumeWithChat(currentResumeData, text);

    return {
      text: "I’ve prepared a suggested change. Would you like to apply it?",
      proposal: {
        data: result.data,
        description: result.description,
        metadata: {
          source: "ai",
          improvedSections: [],
        },
      },
    };
  } catch (err: any) {
    const msg = getErrMessage(err);

    if (isHardQuotaExhausted(err)) {
      return {
        text: "Daily AI quota reached for this project. Please try again tomorrow or upgrade your AI plan.",
      };
    }

    if (/AI_CALL_IN_PROGRESS/i.test(msg)) {
      return { text: "One second — I'm already working on your last request." };
    }

    if (/overloaded|503|unavailable|429|rate limit|quota/i.test(msg)) {
      return { text: "I'm a bit busy right now 😅 Please try again in a moment." };
    }

    return { text: "Something went wrong while editing your resume. Please try again." };
  }
}
