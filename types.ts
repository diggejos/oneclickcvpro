export interface Experience {
  id: string; // ✅ Added for stable keys (fixes focus bug)
  role: string;
  company: string;
  website?: string;
  duration: string;
  points: string[];
  additionalInfo?: string; // ✅ Added
}

export interface Education {
  id: string; // ✅ Added for stable keys
  degree: string;
  school: string;
  website?: string;
  year: string;
  grade?: string; // ✅ Added
  additionalInfo?: string; // ✅ Added
}

export interface ResumeData {
  fullName: string;
  contactInfo: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  profileImage?: string;
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
  refinementLevel: number;
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
  content: string;
  mimeType?: string;
  fileName?: string;
}

// --- APP MANAGEMENT ---

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  credits: number;
}

export interface SavedResume {
  id: string;
  title: string;
  lastModified: number;
  
  baseResumeInput: FileInput;
  jobDescriptionInput: FileInput;
  baseResumeData: ResumeData | null;
  tailoredResumeData: ResumeData | null;
  config: ResumeConfig;
  profileImage?: string;
}

// --- MARKETING & CONTENT ---

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
}

export type PageView = 'home' | 'editor' | 'dashboard' | 'auth' | 'blog' | 'about' | 'legal' | 'pricing' | 'contact' | 'product';
export type LegalPageType = 'impressum' | 'privacy' | 'terms';
export type ProductType = 'builder' | 'linkedin' | 'tailoring';
