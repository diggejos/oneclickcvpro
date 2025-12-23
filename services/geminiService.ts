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
      // If quota exceeded (429), fail immediately
      if (err?.response?.status === 429 || err?.status === 429) throw err;

      const last = attempt === retries;
      if (!isOverloaded503(err) || last) throw err;

      // exponential backoff
      const base = Math.min(6000, 1000 * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 500);
      await sleep(base + jitter);
    }
  }
  throw new Error("AI_RETRY_FAILED");
}

/* -------------------- Gemini client -------------------- */
// Initialize the official Web SDK
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const MODEL_NAME = "gemini-1.5-flash";

/* -------------------- Schema -------------------- */
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
            description: "The official website domain (e.g. 'harvard.edu').",
          },
          year: { type: SchemaType.STRING },
        },
      },
    },
  },
  required: ["fullName", "summary", "skills", "experience"],
};

/* -------------------- Helper: Text or PDF Part -------------------- */
// Converts file input to the format expected by GoogleGenerativeAI
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
Extract structured data from the resume.
Infer standard dates (e.g., "Jan 2020 - Present").
Infer 'website' domains for companies/schools (e.g. 'microsoft.com').
  `.trim();

  const userContent = getContentParts(baseInput);
  userContent.push({ text: "Extract the data into the specified JSON format." });

  // Note: systemInstruction is passed at initialization or prepended to prompt in older versions,
  // but for 1.5-flash, passing it as a systemInstruction property often works best if supported,
  // otherwise we append it to the prompt. Here we prepend to ensure compatibility.
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

  let toneInstruction = "Professional balanced tone.";
  if (config.tone === "corporate") toneInstruction = "Executive, ROI-focused corporate tone.";
  if (config.tone === "creative") toneInstruction = "Energetic, innovative, creative tone.";

  const systemInstruction = `
You are an expert resume strategist.
Rewrite the resume based on these constraints:
Tone: ${toneInstruction}
Language: ${config.language}
Refinement Level: ${config.refinementLevel}/100

CRITICAL: Translate all content to ${config.language}, but keep JSON keys in English.
Preserve 'website' fields.
  `.trim();

  // Sanitize input
  const cleanData = { ...baseResumeData };
  delete cleanData.profileImage;

  const parts = [
    { text: systemInstruction },
    { text: `CURRENT RESUME JSON: ${JSON.stringify(cleanData)}` }
  ];

  if (jobDescriptionInput && (jobDescriptionInput.content || jobDescriptionInput.type === "file")) {
    parts.push({ text: "TARGET JOB DESCRIPTION:" });
    parts.push(...getContentParts(jobDescriptionInput));
  } else {
    parts.push({ text: "Refine the resume style and language only." });
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
  
  // Define a schema specifically for the chat response
  const CHAT_RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
      data: RESUME_SCHEMA,
      description: { type: SchemaType.STRING },
    },
    required: ["data", "description"],
  };

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: CHAT_RESPONSE_SCHEMA,
    },
  });

  const cleanData = { ...currentData };
  delete cleanData.profileImage;

  const parts = [
    { text: "You are an intelligent resume editor. Modify the JSON based on the user request." },
    { text: `CURRENT DATA: ${JSON.stringify(cleanData)}` },
    { text: `USER REQUEST: ${userPrompt}` }
  ];

  const result = await withRetry(() => model.generateContent(parts));
  const responseText = result.response.text();

  if (!responseText) throw new Error("No response generated from AI");
  return JSON.parse(responseText) as { data: ResumeData; description: string };
};

/* -------------------- Unified Chat Agent -------------------- */
export async function unifiedChatAgent(
  history: { role: "user" | "model" | "assistant"; text: string }[],
  text: string,
  currentResumeData: ResumeData | null
) {
  // If no resume, use standard text mode (no JSON enforcement)
  if (!currentResumeData) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Map history to the format Google Generative AI expects
    // Note: 'assistant' is not a valid role in this SDK, map to 'model'
    const chatHistory = history.map(h => ({
      role: h.role === "assistant" ? "model" : h.role,
      parts: [{ text: h.text }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: "You are the helpful support assistant for OneClickCVPro. Be brief and friendly.",
    });

    try {
      const result = await withRetry(() => chat.sendMessage(text));
      return { text: result.response.text() };
    } catch (err) {
      console.error("Support Chat Error:", err);
      return { text: "I'm having trouble connecting right now. Please try again." };
    }
  }

  // If resume is loaded, use the update function
  try {
    const result = await updateResumeWithChat(currentResumeData, text);
    return {
      text: "I’ve prepared a suggested change. Would you like to apply it?",
      proposal: {
        data: result.data,
        description: result.description,
        metadata: { source: "ai", improvedSections: [] },
      },
    };
  } catch (err: any) {
    console.error("Resume Update Error:", err);
    if (err?.message?.includes("429")) return { text: "⚠️ Usage limit hit. Please wait a moment." };
    return { text: "Something went wrong while editing your resume. Please try again." };
  }
}
