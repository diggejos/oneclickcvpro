export interface Experience {
  role: string;
  company: string;
  website?: string; // Domain for logo fetching
  duration: string;
  points: string[];
}

export interface Education {
  degree: string;
  school: string;
  website?: string; // Domain for logo fetching
  year: string;
}

export interface ResumeData {
  fullName: string;
  contactInfo: string; // Email | Phone | LinkedIn
  location: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  profileImage?: string; // Base64 string
}

export enum AppState {
  IDLE,
  GENERATING_BASE,
  BASE_READY,
  GENERATING_TAILORED,
  TAILORED_READY,
  ERROR
}

export type ResumeLength = 'concise' | 'standard' | 'detailed';
export type ResumeTone = 'corporate' | 'standard' | 'creative';
export type TemplateId = 'classic' | 'modern' | 'minimal';
export type ResumeLanguage = 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese' | 'Dutch' | 'Chinese' | 'Japanese';

export interface ResumeConfig {
  length: ResumeLength;
  tone: ResumeTone;
  template: TemplateId;
  refinementLevel: number; // 0 to 100
  showLogos: boolean;
  language: ResumeLanguage;
}

export interface ChatProposal {
  data: ResumeData;
  description: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  proposal?: ChatProposal;
}

export interface FileInput {
  type: 'text' | 'file';
  content: string; // Text content or Base64 string
  mimeType?: string;
  fileName?: string;
}

// --- NEW TYPES FOR APP MANAGEMENT ---

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  credits: number; // For Freemium Model
}

export interface SavedResume {
  id: string;
  title: string;
  lastModified: number;
  
  // State required to restore the editor
  baseResumeInput: FileInput;
  jobDescriptionInput: FileInput;
  baseResumeData: ResumeData | null;
  tailoredResumeData: ResumeData | null;
  config: ResumeConfig;
  profileImage?: string;
}