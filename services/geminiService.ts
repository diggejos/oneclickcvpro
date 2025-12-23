import { ResumeData, ResumeConfig, FileInput } from "../types";

// Base URL handling for Dev/Prod
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4242";

// Helper to get headers
const getHeaders = () => {
  const userId = localStorage.getItem("oneclickcv_user_id"); // Or however you store Auth
  return {
    "Content-Type": "application/json",
    "x-user-id": userId || "",
  };
};

/* -------------------- 1. Parse Resume -------------------- */
export const parseBaseResume = async (baseInput: FileInput): Promise<ResumeData> => {
  const response = await fetch(`${API_URL}/api/ai/parse`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ baseInput }),
  });

  if (!response.ok) {
    throw new Error("Failed to parse resume");
  }

  return await response.json();
};

/* -------------------- 2. Generate Tailored Resume -------------------- */
export const generateTailoredResume = async (
  baseResumeData: ResumeData,
  jobDescriptionInput: FileInput | null,
  config: ResumeConfig
): Promise<ResumeData> => {
  
  const response = await fetch(`${API_URL}/api/ai/tailor`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      baseResumeData,
      jobDescriptionInput,
      config,
    }),
  });

  if (response.status === 402) {
    throw new Error("NOT_ENOUGH_CREDITS");
  }
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate resume");
  }

  return await response.json();
};

/* -------------------- 3. Unified Chat Agent -------------------- */
export type UnifiedChatResult = {
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

export async function unifiedChatAgent(
  history: { role: "user" | "model" | "assistant"; text: string }[],
  text: string,
  currentResumeData: ResumeData | null
): Promise<UnifiedChatResult> {
  
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      history,
      text,
      currentResumeData,
    }),
  });

  if (!response.ok) {
    return { text: "I'm having trouble connecting to the server right now." };
  }

  return await response.json();
}

// Deprecated: Kept only if other components import it directly, 
// but unifiedChatAgent covers this now.
export const updateResumeWithChat = async (
  currentData: ResumeData,
  userPrompt: string
): Promise<{ data: ResumeData; description: string }> => {
  const res = await unifiedChatAgent([], userPrompt, currentData);
  if (res.proposal) {
    return { data: res.proposal.data, description: res.proposal.description };
  }
  throw new Error("Failed to update resume");
};
