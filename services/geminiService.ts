import { GoogleGenAI, Type, Schema, Part } from "@google/genai";
import { ResumeData, ResumeConfig, FileInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      description: "Top skills relevant to the job"
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          website: { type: Type.STRING, description: "The official website domain of the company (e.g. 'google.com'). Guess if unknown." },
          duration: { type: Type.STRING },
          points: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Bullet points focusing on impact and metrics" 
          }
        }
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          school: { type: Type.STRING },
          website: { type: Type.STRING, description: "The official website domain of the school (e.g. 'harvard.edu'). Guess if unknown." },
          year: { type: Type.STRING }
        }
      }
    }
  },
  required: ["fullName", "summary", "skills", "experience"]
};

// Helper to construct the 'contents' part for Gemini, handling Text or PDF
const getContentPart = (input: FileInput): Part => {
  if (input.type === 'file' && input.mimeType && input.content) {
    // Strip base64 prefix if present
    const base64Data = input.content.split(',')[1] || input.content;
    return {
      inlineData: {
        mimeType: input.mimeType,
        data: base64Data
      }
    };
  } else {
    return { text: input.content };
  }
};

export const parseBaseResume = async (baseInput: FileInput): Promise<ResumeData> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are an expert data extraction assistant.
    Your task is to extract structured data from a raw resume (text or PDF).
    Do not rewrite or embellish the content yet. Keep it as close to the original as possible while formatting it cleanly.
    If dates are ambiguous, infer standard formats (e.g., "Jan 2020 - Present").
    Standardize the "skills" list into a clean array of strings.
    IMPORTANT: Infer the 'website' domain for every company and university (e.g. 'microsoft.com', 'stanford.edu') so logos can be fetched.
  `;

  const contentPart = getContentPart(baseInput);

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        contentPart,
        { text: "Extract the data into the specified JSON format." }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: RESUME_SCHEMA
    }
  });

  if (!response.text) {
    throw new Error("No response generated from AI");
  }

  return JSON.parse(response.text) as ResumeData;
};

export const generateTailoredResume = async (
  baseResumeData: ResumeData,
  jobDescriptionInput: FileInput | null,
  config: ResumeConfig
): Promise<ResumeData> => {
  const model = "gemini-2.5-flash";

  let toneInstruction = "";
  switch (config.tone) {
    case 'corporate':
      toneInstruction = "Use highly professional, executive-level language. Focus on ROI, strategic impact, and formal business terminology. Avoid casual phrasing.";
      break;
    case 'creative':
      toneInstruction = "Use engaging, innovative, and energetic language. Show personality. Focus on creativity, adaptability, and fresh perspectives.";
      break;
    default:
      toneInstruction = "Use a standard, balanced professional tone suitable for most industries.";
  }

  let lengthInstruction = "";
  switch (config.length) {
    case 'concise':
      lengthInstruction = "Keep it extremely concise. Summary should be under 3 sentences. Limit experience to the 3 most recent/relevant roles with max 3 bullet points each. Focus only on the absolute highlights.";
      break;
    case 'detailed':
      lengthInstruction = "Provide a comprehensive detailed overview. Elaborate on projects in the summary. Include up to 5-6 bullet points per role, detailing specific methodologies and outcomes.";
      break;
    default:
      lengthInstruction = "Standard length. Summary approx 4-5 sentences. 3-5 bullet points per relevant role.";
  }

  // Refinement/Rewriting Level Logic
  let refinementInstruction = "";
  if (config.refinementLevel <= 20) {
    refinementInstruction = "STRICTLY PRESERVE ORIGINAL PHRASING. Only fix grammatical errors or major formatting issues. Do not sound like an AI. Keep the user's original voice.";
  } else if (config.refinementLevel <= 60) {
    refinementInstruction = "Polish the resume for clarity and professionalism. Improve awkward sentences but keep the original meaning and tone intact. Avoid over-optimizing.";
  } else {
    refinementInstruction = "COMPLETELY REWRITE for maximum impact. Use strong action verbs and persuasive language. Optimize heavily for ATS keywords. It is acceptable to sound very polished.";
  }

  const isRefinementOnly = !jobDescriptionInput || (!jobDescriptionInput.content && jobDescriptionInput.type === 'text');

  const systemInstruction = `
    You are an expert resume strategist. 
    Your task is to take existing resume data and rewrite it based on specific constraints.
    
    CONFIGURATION:
    Tone: ${toneInstruction}
    Length: ${lengthInstruction}
    Rewriting Intensity: ${refinementInstruction}
    Target Language: ${config.language}

    TASK:
    ${isRefinementOnly ? 
      "The user wants to refine the style, length, and language of their current resume without targeting a specific job. Maintain the core information but adjust the phrasing, detail level, and language." : 
      "The user wants to tailor this resume to a specific Job Description. Prioritize experience and skills that match the JD keywords."
    }
    
    CRITICAL: Translate all content values (summary, roles, descriptions, skills, etc.) into ${config.language}.
    However, you MUST keep the JSON keys (fullName, experience, role, company, etc.) in English as defined in the schema.
    
    Ensure you preserve the 'website' fields for companies and schools in the output.

    Ensure the output strictly follows the JSON schema.
  `;

  const parts: Part[] = [
    { text: `CURRENT RESUME JSON: ${JSON.stringify(baseResumeData)}` }
  ];

  if (!isRefinementOnly && jobDescriptionInput) {
    parts.push({ text: "TARGET JOB DESCRIPTION:" });
    parts.push(getContentPart(jobDescriptionInput));
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: RESUME_SCHEMA
    }
  });

  if (!response.text) {
    throw new Error("No response generated from AI");
  }

  return JSON.parse(response.text) as ResumeData;
};

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
  `;

  const prompt = `
    CURRENT DATA:
    ${JSON.stringify(currentData)}

    USER REQUEST:
    ${userPrompt}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          data: RESUME_SCHEMA,
          description: { type: Type.STRING, description: "Brief description of changes made, e.g., 'Added Python to skills' or 'Rewrote summary'." }
        },
        required: ["data", "description"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response generated from AI");
  }

  return JSON.parse(response.text) as { data: ResumeData; description: string };
}


import type { ResumeData } from "../types";

interface UnifiedChatResult {
  text: string;
  proposal?: {
    data: ResumeData;
    metadata: {
      source: "ai";
      improvedSections: string[];
    };
  };
}

/**
 * Temporary unified chat agent stub.
 * This makes the app build on Render.
 * You can later replace the implementation with real Gemini logic.
 */
export async function unifiedChatAgent(
  history: { role: "user" | "model"; text: string }[],
  text: string,
  currentResumeData: ResumeData | null
): Promise<UnifiedChatResult> {
  // For now, just return a dummy response so the UI works
  return {
    text:
      "AI assistant is not fully configured on this deployment yet. You said: " +
      text,
    proposal: currentResumeData
      ? {
          data: currentResumeData,
          metadata: {
            source: "ai",
            improvedSections: [],
          },
        }
      : undefined,
  };
}
