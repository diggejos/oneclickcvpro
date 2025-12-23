import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ResumeData, ResumeConfig, FileInput } from "../types";

/* -------------------- retry/backoff helpers -------------------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isOverloaded503(err: any) {
  const code = err?.response?.status || err?.status || err?.code;
  const msg = String(err?.message || "");
  return code === 503 || /overloaded|unavailable|503/i.test(msg);
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      // ✅ If quota exceeded (429), fail immediately
      if (err?.response?.status === 429 || err?.status === 429) throw err;

      const last = attempt === retries;
      if (!isOverloaded503(err) || last) throw err;

      // exponential backoff + jitter
      const base = Math.min(8000, 1000 * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 500);
      await sleep(base + jitter);
    }
  }
  throw new Error("AI_RETRY_FAILED");
}

/* -------------------- Gemini client -------------------- */
// ✅ Initialize the official Web SDK
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ✅ USE STABLE 1.5 FLASH
const MODEL_NAME = "gemini-1.5-flash";

/* -------------------- Schema -------------------- */
// Converted to SchemaType for the Web SDK
const RESUME_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    fullName: { type: SchemaType.STRING },
    contactInfo: { type: SchemaType.STRING, description: "Format: Email | Phone | LinkedIn" },
    location: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Top skills relevant to the job",
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          company: { type: SchemaType.STRING },
          website: {
            type: SchemaType.STRING,
            description: "The official website domain (e.g. 'google.com'). Guess if unknown.",
          },
          duration: { type: SchemaType.STRING },
          points: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Bullet points focusing on impact and metrics",
          },
        },
      },
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          degree: { type: SchemaType.STRING },
          school: { type: SchemaType.STRING },
          website: {
            type: SchemaType.STRING,
            description: "The official website domain (e.g. 'harvard.edu'). Guess if unknown.",
          },
          year: { type: SchemaType.STRING },
        },
      },
    },
  },
  required: ["fullName", "summary", "skills", "experience"],
};

/* -------------------- Helper: Text or PDF Part -------------------- */
const getContentParts = (input: FileInput) => {
  if (input.type === "file" && input.mimeType && input.content) {
    const base64Data = input.content.split(",")[1] || input.content;
    return [
      {
        inlineData: {
          mimeType: input.mimeType,
          data: base64Data,
        },
      },
    ];
  }
  return [{ text: input.content }];
};

/* -------------------- Base Resume Parsing -------------------- */
export const parseBaseResume = async (baseInput: FileInput): Promise<ResumeData> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESUME_SCHEMA,
    },
  });

  const systemInstruction = `
You are an expert data extraction assistant.
Your task is to extract structured data from a raw resume (text or PDF).
Do not rewrite or embellish the content yet. Keep it as close to the original as possible while formatting it cleanly.
If dates are ambiguous, infer standard formats (e.g., "Jan 2020 - Present").
Standardize the "skills" list into a clean array of strings.
IMPORTANT: Infer the 'website' domain for every company and university (e.g. 'microsoft.com', 'stanford.edu') so logos can be fetched.
  `.trim();

  const userContent = getContentParts(baseInput);
  userContent.push({ text: "Extract the data into the specified JSON format." });

  // Pass system instruction as first part of prompt for best Web SDK compatibility
  const promptParts = [{ text: systemInstruction }, ...userContent];

  const result = await withRetry(() => model.generateContent(promptParts));
  const responseText = result.response.text();

  if (!responseText) throw new Error("No response generated from AI");

  return JSON.parse(responseText) as ResumeData;
};

/* -------------------- Tailored Resume Generation -------------------- */
export const generateTailoredResume = async (
  baseResumeData: ResumeData,
  jobDescriptionInput: FileInput | null,
  config: ResumeConfig
): Promise<ResumeData> => {

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESUME_SCHEMA,
    },
  });

  // ✅ RESTORED ORIGINAL PROMPT LOGIC
  let toneInstruction = "";
  switch (config.tone) {
    case "corporate":
      toneInstruction = "Use highly professional, executive-level language. Focus on ROI, strategic impact, and formal business terminology."; break;
    case "creative":
      toneInstruction = "Use engaging, innovative, and energetic language. Show personality. Focus on creativity, adaptability, and fresh perspectives."; break;
    default:
      toneInstruction = "Use a standard, balanced professional tone suitable for most industries.";
  }

  let lengthInstruction = "";
  switch (config.length) {
    case "concise":
      lengthInstruction = "Keep it extremely concise. Summary should be under 3 sentences. Limit experience to the 3 most recent/relevant roles."; break;
    case "detailed":
      lengthInstruction = "Provide a comprehensive detailed overview. Elaborate on projects in the summary. Include up to 5-6 bullet points per role."; break;
    default:
      lengthInstruction = "Standard length. Summary approx 4-5 sentences. 3-5 bullet points per relevant role.";
  }

  let refinementInstruction = "";
  if (config.refinementLevel <= 20) {
    refinementInstruction = "STRICTLY PRESERVE ORIGINAL PHRASING. Only fix grammatical errors or major formatting issues.";
  } else if (config.refinementLevel <= 60) {
    refinementInstruction = "Polish the resume for clarity and professionalism. Improve awkward sentences but keep the original meaning and tone intact.";
  } else {
    refinementInstruction = "COMPLETELY REWRITE for maximum impact. Use strong action verbs and persuasive language. Optimize heavily for ATS keywords.";
  }

  const isRefinementOnly = !jobDescriptionInput || (!jobDescriptionInput.content && jobDescriptionInput.type === "text");

  const systemInstruction = `
You are an expert resume strategist.
Your task is to take existing resume data and rewrite it based on specific constraints.

CONFIGURATION:
Tone: ${toneInstruction}
Length: ${lengthInstruction}
Rewriting Intensity: ${refinementInstruction}
Target Language: ${config.language}

TASK:
${isRefinementOnly
    ? "The user wants to refine the style, length, and language of their current resume without targeting a specific job."
    : "The user wants to tailor this resume to a specific Job Description. Prioritize experience and skills that match the JD keywords."
}

CRITICAL: Translate all content values (summary, roles, descriptions, skills, etc.) into ${config.language}.
However, you MUST keep the JSON keys (fullName, experience, role, company, etc.) in English as defined in the schema.

Ensure you preserve the 'website' fields for companies and schools in the output.
Ensure the output strictly follows the JSON schema.
  `.trim();

  // ✅ SANITIZE INPUT
  const cleanData = { ...baseResumeData };
  delete cleanData.profileImage;

  const parts = [
    { text: systemInstruction },
    { text: `CURRENT RESUME JSON: ${JSON.stringify(cleanData)}` }
  ];

  if (!isRefinementOnly && jobDescriptionInput) {
    parts.push({ text: "TARGET JOB DESCRIPTION:" });
    parts.push(...getContentParts(jobDescriptionInput));
  }

  const result = await withRetry(() => model.generateContent(parts));
  const responseText = result.response.text();

  if (!responseText) throw new Error("No response generated from AI");

  return JSON.parse(responseText) as ResumeData;
};

/* -------------------- Chat-driven Resume Update -------------------- */
export const updateResumeWithChat = async (
  currentData: ResumeData,
  userPrompt: string
): Promise<{ data: ResumeData; description: string }> => {
  
  const CHAT_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
      data: RESUME_SCHEMA,
      description: {
        type: SchemaType.STRING,
        description: "Brief description of changes made.",
      },
    },
    required: ["data", "description"],
  };

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: CHAT_SCHEMA,
    },
  });

  const systemInstruction = `
You are an intelligent resume editor.
The user will provide their current resume data (JSON) and a request to modify it.

Your task is to:
1. Perform the requested modification (add, delete, edit, rephrase) on the JSON data.
2. Provide a very brief (1 sentence) description of what you changed.

Do not lose any existing data unless explicitly asked to remove it.
Preserve 'website' fields.
  `.trim();

  const cleanData = { ...currentData };
  delete cleanData.profileImage;

  const parts = [
    { text: systemInstruction },
    { text: `CURRENT DATA: ${JSON.stringify(cleanData)}` },
    { text: `USER REQUEST: ${userPrompt}` }
  ];

  const result = await withRetry(() => model.generateContent(parts));
  const responseText = result.response.text();

  if (!responseText) throw new Error("No response generated from AI");

  return JSON.parse(responseText) as { data: ResumeData; description: string };
};

/* -------------------- Unified Chat Agent -------------------- */
interface UnifiedChatResult {
  text: string;
  proposal?: {
    data: ResumeData;
    description: string;
    metadata: {
      source: "ai";
      improvedSections: string[];
    };
  };
}

export async function unifiedChatAgent(
  history: { role: "user" | "model" | "assistant"; text: string }[],
  text: string,
  currentResumeData: ResumeData | null
): Promise<UnifiedChatResult> {

  // 🟡 No resume loaded → Support / Q&A Mode
  if (!currentResumeData) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Convert history for Web SDK ('assistant' -> 'model')
    const chatHistory = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.text }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: `
        You are the expert AI support assistant for OneClickCVPro.
        Your role is to answer questions about the app, features, pricing, and general resume advice.
        Be helpful, brief, and friendly. Do not hallucinate features.
      `.trim(),
    });

    try {
      const result = await withRetry(() => chat.sendMessage(text));
      return { text: result.response.text() || "I'm sorry, I couldn't generate a response." };
    } catch (err: any) {
       console.error("Support Chat Error:", err);
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
    const msg = String(err?.message || err);

    if (msg.includes("429")) {
       return {
         text: "⚠️ You've hit the usage limit. Please wait a moment or upgrade.",
       };
    }

    if (/overloaded|503|unavailable/i.test(msg)) {
      return {
        text: "I’m a bit busy right now 😅 Please try again in a moment.",
      };
    }

    return {
      text: "Something went wrong while editing your resume. Please try again.",
    };
  }
}
