import React, { useState, useEffect, useRef } from "react";
import { InputPanel } from "./InputPanel";
import { ResumePreview } from "./ResumePreview";
import { generateTailoredResume, parseBaseResume } from "../services/geminiService";
import {
  ResumeData,
  AppState,
  ResumeConfig,
  FileInput,
  SavedResume,
  User,
  PageView,
  ResumeLanguage, // ✅ Imported
} from "../types";
import {
  AlertCircle,
  Layers,
  LogIn,
  Linkedin,
  Wand2,
  CheckCircle2,
  Zap,
  Edit3,
  Pencil,
  Save,
  Eye,
  Sliders,
  Globe, // ✅ Imported
  ChevronDown // ✅ Imported
} from "lucide-react";
import { EditModal } from "./EditModal";
import { Logo } from "./Logo";
import { Footer } from "./Footer";
import { EditorActions } from "../App";

// ✅ 1. TRANSLATION MAP (Exported for Preview to use)
export const SECTION_TITLES: Record<string, Record<string, string>> = {
  "Professional Summary": { English: "Professional Summary", German: "Profil", French: "Profil Professionnel", Spanish: "Perfil Profesional", Italian: "Profilo Professionale", Portuguese: "Resumo Profissional" },
  "Experience": { English: "Experience", German: "Berufserfahrung", French: "Expérience", Spanish: "Experiencia", Italian: "Esperienza", Portuguese: "Experiência" },
  "Education": { English: "Education", German: "Ausbildung", French: "Formation", Spanish: "Educación", Italian: "Istruzione", Portuguese: "Educação" },
  "Core Competencies": { English: "Core Competencies", German: "Kernkompetenzen", French: "Compétences Clés", Spanish: "Competencias Básicas", Italian: "Competenze Chiave", Portuguese: "Competências Essenciais" },
  "Contact": { English: "Contact", German: "Kontakt", French: "Contact", Spanish: "Contacto", Italian: "Contatto", Portuguese: "Contato" },
};

interface EditorProps {
  initialResume?: SavedResume | null;
  onSave: (resume: SavedResume) => void;
  onBack: () => void;
  isGuest?: boolean;
  onRequireAuth: () => void;
  currentUser: User | null;
  onAddCredits: () => void;
  onNavigate: (page: PageView, subPage?: any) => void;
  onRegisterActions: (actions: EditorActions | null) => void;
  onSpendCredit: (reason: string) => Promise<number>;
}

export const Editor: React.FC<EditorProps> = ({
  initialResume,
  onSave,
  onBack,
  isGuest,
  onRequireAuth,
  currentUser,
  onAddCredits,
  onNavigate,
  onRegisterActions,
  onSpendCredit,
}) => {
  // -------------------------
  // Inputs
  // -------------------------
  const [resumeId] = useState<string>(initialResume?.id || crypto.randomUUID());
  const [resumeTitle, setResumeTitle] = useState<string>(
    initialResume?.title || "Untitled Resume"
  );
  const [baseResumeInput, setBaseResumeInput] = useState<FileInput>(
    initialResume?.baseResumeInput || { type: "text", content: "" }
  );
  const [jobDescriptionInput, setJobDescriptionInput] = useState<FileInput>(
    initialResume?.jobDescriptionInput || { type: "text", content: "" }
  );

  const [appState, setAppState] = useState<AppState>(
    initialResume?.baseResumeData ? AppState.BASE_READY : AppState.IDLE
  );
   
  const [previewResumeData, setPreviewResumeData] = useState<ResumeData | null>(null);

  const [config, setConfig] = useState<ResumeConfig>(
    initialResume?.config || {
      length: "standard",
      tone: "standard",
      template: "classic",
      refinementLevel: 50,
      showLogos: true,
      language: "English",
    }
  );

  const [profileImage, setProfileImage] = useState<string | undefined>(
    initialResume?.profileImage
  );

  // -------------------------
  // Data
  // -------------------------
  const [baseResumeData, setBaseResumeData] = useState<ResumeData | null>(
    initialResume?.baseResumeData || null
  );
  const [tailoredResumeData, setTailoredResumeData] = useState<ResumeData | null>(
    initialResume?.tailoredResumeData || null
  );

  const [viewMode, setViewMode] = useState<"base" | "tailored">("base");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"inputs" | "preview">("inputs");

  // Autosave
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false); // ✅ Added for dropdown

  // -------------------------
  // ⚡ FIX: Refs for AI Access
  // -------------------------
  const baseResumeDataRef = useRef(baseResumeData);
  const tailoredResumeDataRef = useRef(tailoredResumeData);
  const previewResumeDataRef = useRef(previewResumeData);

  useEffect(() => {
    baseResumeDataRef.current = baseResumeData;
    tailoredResumeDataRef.current = tailoredResumeData;
    previewResumeDataRef.current = previewResumeData;
  }, [baseResumeData, tailoredResumeData, previewResumeData]);

  useEffect(() => {
    if (initialResume?.tailoredResumeData) {
      setViewMode("tailored");
      setAppState(AppState.TAILORED_READY);
    }
  }, [initialResume]);

  // -------------------------
  // ⚡ FIX: Updated Action Registration
  // -------------------------
  useEffect(() => {
    onRegisterActions({
      getResume: () => {
        // Priority: Active Preview -> Tailored (if view) -> Base
        // This allows "chaining" AI commands on top of an unaccepted preview
        if (previewResumeDataRef.current) {
            return previewResumeDataRef.current;
        }
        return viewMode === "tailored" 
            ? tailoredResumeDataRef.current 
            : baseResumeDataRef.current;
      },
      updateResume: (newData: ResumeData) => {
        setPreviewResumeData(null);
        if (viewMode === "tailored") setTailoredResumeData(newData);
        else setBaseResumeData(newData);
      },
      isTailored: () => viewMode === "tailored",
      previewResume: (data: ResumeData) => {
        setPreviewResumeData(data);
        setMobileTab("preview");
      },
      clearPreview: () => setPreviewResumeData(null),
      isPreviewing: () => !!previewResumeDataRef.current,
    });
    return () => onRegisterActions(null);
  }, [viewMode, onRegisterActions]); // Dependency list reduced to avoid re-registering unnecessarily

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfileImage(base64);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateBase = async () => {
    if (!baseResumeInput.content) return;
    setAppState(AppState.GENERATING_BASE);
    setErrorMsg(null);
    setTailoredResumeData(null);
    setViewMode("base");

    try {
      const data = await parseBaseResume(baseResumeInput);
      // ✅ Assign IDs immediately
      data.experience = data.experience.map(e => ({...e, id: crypto.randomUUID()}));
      data.education = data.education.map(e => ({...e, id: crypto.randomUUID()}));
       
      setBaseResumeData(data);
      setAppState(AppState.BASE_READY);
      setIsDirty(true);
      if (resumeTitle === "Untitled Resume") setResumeTitle(`${data.fullName}'s Resume`);
      setMobileTab("preview");
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Failed to analyze base resume. Please try again.");
    }
  };

  const handleStartFromScratch = () => {
    const emptyData: ResumeData = {
      fullName: "Your Name",
      contactInfo: "email@example.com | 123-456-7890",
      location: "City, Country",
      summary: "Write a short professional summary about yourself here...",
      skills: ["Skill 1", "Skill 2", "Skill 3"],
      experience: [{
        id: crypto.randomUUID(),
        role: "Job Title",
        company: "Company Name",
        duration: "2020 - Present",
        points: ["Key achievement or responsibility 1"],
        additionalInfo: ""
      }],
      education: [{
        id: crypto.randomUUID(),
        degree: "Degree Name",
        school: "University / School",
        year: "2019",
        grade: ""
      }],
      profileImage: undefined
    };
    setBaseResumeData(emptyData);
    setAppState(AppState.BASE_READY);
    setViewMode("base");
    if (resumeTitle === "Untitled Resume") setResumeTitle("My New Resume");
    setIsDirty(true);
    setMobileTab("preview");
    setTimeout(() => setIsEditModalOpen(true), 100);
  };

  const handleGenerateTailored = async () => {
    const sourceData = baseResumeData;
    if (!sourceData) return;
    setAppState(AppState.GENERATING_TAILORED);
    setErrorMsg(null);

    try {
      const data = await generateTailoredResume(sourceData, jobDescriptionInput, config);
      // ✅ Assign IDs
      data.experience = data.experience.map(e => ({...e, id: e.id || crypto.randomUUID()}));
      data.education = data.education.map(e => ({...e, id: e.id || crypto.randomUUID()}));

      setTailoredResumeData(data);
      setAppState(AppState.TAILORED_READY);
      setViewMode("tailored");
      setIsDirty(true);
      setMobileTab("preview");
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Failed to process resume. Please try again.");
    }
  };

  const handleResetBase = () => {
    if (window.confirm("Are you sure? This will clear all data.")) {
      setBaseResumeData(null);
      setTailoredResumeData(null);
      setAppState(AppState.IDLE);
      setViewMode("base");
      setIsDirty(true);
      setMobileTab("inputs");
    }
  };

  const handlePrint = (singlePage: boolean = false) => {
    const content = document.getElementById("resume-preview-content");
    if (!content) { alert("Resume content not found."); return; }
    const heightPx = content.scrollHeight;
    const heightMm = Math.ceil(heightPx * 0.264583) + 30;
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const pageCss = singlePage
      ? `@page { size: 210mm ${heightMm}mm; margin: 0; } body { margin: 0; } .resume-preview-container { padding: 15mm !important; box-shadow: none !important; transform: none !important; }`
      : `@page { margin: 0.5cm; size: auto; } .resume-preview-container { transform: none !important; }`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume Export</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: white; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .resume-preview-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 2rem !important; box-shadow: none !important; overflow: visible !important; }
            .grid { display: grid !important; }
            .print\\:hidden { display: none !important; }
            ${pageCss}
          </style>
        </head>
        <body>
          ${content.outerHTML}
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 800); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const activeDataRaw = previewResumeData ? previewResumeData : viewMode === "tailored" && tailoredResumeData ? tailoredResumeData : baseResumeData;
  const activeResumeData = activeDataRaw ? { ...activeDataRaw, profileImage: profileImage || activeDataRaw.profileImage } : null;
  const isTailoredView = viewMode === "tailored" && !!tailoredResumeData;
  const isLoading = appState === AppState.GENERATING_BASE || appState === AppState.GENERATING_TAILORED;
  const isPreviewing = !!previewResumeData;

  // -------------------------
  // ⚡ FIX: Updated Manual Save
  // -------------------------
  const handleManualSave = (newData: ResumeData) => {
    // Clear preview so next AI operation sees the committed data
    setPreviewResumeData(null); 
    
    if (isTailoredView) setTailoredResumeData(newData);
    else setBaseResumeData(newData);
    
    setIsDirty(true);
  };

  const buildResumePayload = (): SavedResume => ({
    id: resumeId,
    title: resumeTitle,
    lastModified: Date.now(),
    baseResumeInput,
    jobDescriptionInput,
    baseResumeData,
    tailoredResumeData,
    config,
    profileImage,
  });

  const triggerSave = () => {
    const resumeToSave = buildResumePayload();
    if (isGuest) { onSave(resumeToSave); onRequireAuth(); return; }
    onSave(resumeToSave);
    setIsDirty(false);
    setLastSavedAt(Date.now());
  };

  useEffect(() => {
    if (isGuest || !currentUser) return;
    setIsDirty(true);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      try {
        const hasContent = (baseResumeInput.content && baseResumeInput.content.trim().length > 0) || (jobDescriptionInput.content && jobDescriptionInput.content.trim().length > 0) || baseResumeData !== null || tailoredResumeData !== null;
        if (!hasContent) return;
        const resumeToSave = buildResumePayload();
        onSave(resumeToSave);
        setIsDirty(false);
        setLastSavedAt(Date.now());
      } catch (e) { console.warn("Autosave failed", e); }
    }, 1200);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [resumeTitle, baseResumeInput, jobDescriptionInput, baseResumeData, tailoredResumeData, config, profileImage]);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {/* Mobile Top Switcher */}
      <div className="md:hidden z-20 bg-white border-b border-slate-200">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Logo iconOnly className="w-7 h-7 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-700 truncate">{resumeTitle || "Untitled Resume"}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setMobileTab("inputs")} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${mobileTab === "inputs" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-600 border-slate-200"}`}><Sliders size={14} /> Inputs</button>
            <button onClick={() => setMobileTab("preview")} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${mobileTab === "preview" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-600 border-slate-200"}`}><Eye size={14} /> Preview</button>
          </div>
        </div>
      </div>

      {/* LEFT PANEL */}
      <div className={["w-full md:w-[400px] flex-shrink-0 bg-white flex flex-col border-r border-slate-200", "md:h-[calc(100vh-56px)] md:sticky md:top-[56px] md:z-10", "max-h-[calc(100vh-56px)]", mobileTab === "preview" ? "md:flex hidden" : "flex"].join(" ")}>
        <div className="hidden md:flex px-4 py-3 border-b border-slate-200 bg-slate-50 items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Logo iconOnly className="w-7 h-7 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0 w-full">
              <Pencil size={14} className="text-slate-400 flex-shrink-0" />
              <input value={resumeTitle} onChange={(e) => setResumeTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 w-full min-w-0 truncate" placeholder="Untitled Resume" />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isGuest ? (
              <button onClick={onRequireAuth} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded border border-indigo-200 flex items-center gap-1"><LogIn size={12} /> Login</button>
            ) : (
              <button onClick={triggerSave} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded border border-indigo-200 flex items-center gap-2" title="Save now"><Save size={14} />{isDirty ? "Save" : "Saved"}</button>
            )}
          </div>
        </div>
        <div className="hidden md:block px-4 py-2 border-b border-slate-200 text-[11px] text-slate-500">
          {isGuest ? <span>Guest mode: log in to save resumes.</span> : <span>{isDirty ? "Unsaved changes… autosaving" : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Saved"}</span>}
        </div>
        <div className="flex-grow overflow-y-auto">
          <InputPanel baseResumeInput={baseResumeInput} setBaseResumeInput={(v) => { setBaseResumeInput(v); setIsDirty(true); }} jobDescriptionInput={jobDescriptionInput} setJobDescriptionInput={(v) => { setJobDescriptionInput(v); setIsDirty(true); }} onGenerateBase={handleGenerateBase} onStartFromScratch={handleStartFromScratch} onGenerateTailored={handleGenerateTailored} onPrint={handlePrint} appState={appState} resetBase={handleResetBase} config={config} setConfig={(updater) => { setConfig(updater); setIsDirty(true); }} onImageUpload={handleImageUpload} profileImage={profileImage} userCredits={currentUser?.credits} onAddCredits={onAddCredits} isGuest={isGuest} onRequireAuth={onRequireAuth} onSpendCredit={onSpendCredit} />
        </div>
      </div>

      {/* RIGHT PREVIEW */}
      <div className={["flex-grow overflow-y-auto bg-slate-200/50 relative", "md:h-[calc(100vh-56px)]", mobileTab === "inputs" ? "md:block hidden" : "block"].join(" ")}>
        {!activeResumeData && !isLoading && appState !== AppState.ERROR && (
          <div className="h-full flex flex-col items-center animate-in fade-in zoom-in duration-500 overflow-y-auto">
            <article className="max-w-3xl w-full text-center space-y-8 pt-4 px-6 pb-8 flex-grow">
              <Logo className="justify-center scale-150 mb-6 mt-10" />
              <header className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">OneClick<span className="text-indigo-600">CV</span>Pro</h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">Transform your LinkedIn Profile into a perfect, ATS-ready resume in seconds.</p>
              </header>
              <div className="pt-6 mb-10"><p className="text-sm font-bold text-indigo-600 flex items-center justify-center gap-2 animate-pulse"><Zap size={16} /> Start on the left panel to begin</p></div>
            </article>
            <div className="w-full"><Footer onNavigate={onNavigate} /></div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-800 font-semibold animate-pulse">Processing...</p>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="w-full max-w-lg mx-auto mt-20 p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4 mx-6">
            <AlertCircle className="text-red-600 mt-1" />
            <div><h3 className="font-bold text-red-800">Error</h3><p className="text-red-600 text-sm">{errorMsg}</p></div>
          </div>
        )}

        {activeResumeData && (
          <div className={["p-4 md:p-8 transition-all duration-300 h-full overflow-y-auto flex flex-col items-center", isLoading ? "opacity-30 blur-[1px]" : "opacity-100", isPreviewing ? "bg-indigo-50/60 border-2 border-dashed border-indigo-300 rounded-xl" : ""].join(" ")}>
            <div className="w-full max-w-[210mm] mb-4 flex items-center justify-between text-sm font-medium text-slate-500">
              <div className="flex items-center gap-3">
                 <div className="bg-slate-200 p-1 rounded-lg flex text-xs font-bold shadow-inner">
                  <button onClick={() => setViewMode("base")} className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === "base" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Layers size={12} /> Base</button>
                  <button onClick={() => setViewMode("tailored")} disabled={!tailoredResumeData} className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === "tailored" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"} ${!tailoredResumeData ? "opacity-50 cursor-not-allowed" : "hover:text-slate-700"}`}><Layers size={12} /> Tailored</button>
                </div>
                
                {/* ✅ LANGUAGE SWITCHER */}
                <div className="relative">
                   <button 
                     onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                     className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
                   >
                     <Globe size={14} /> {config.language} <ChevronDown size={12} />
                   </button>
                   {isLangMenuOpen && (
                     <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 w-32">
                       {['English', 'German', 'French', 'Spanish', 'Italian', 'Portuguese'].map((lang) => (
                         <button 
                           key={lang}
                           onClick={() => {
                             setConfig({ ...config, language: lang as ResumeLanguage });
                             setIsLangMenuOpen(false);
                             setIsDirty(true);
                           }}
                           className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 font-medium"
                         >
                           {lang}
                         </button>
                       ))}
                     </div>
                   )}
                </div>
              </div>

              <div className="flex gap-2">
                {isPreviewing && <button onClick={() => setPreviewResumeData(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 shadow-sm">Exit preview</button>}
                <button onClick={() => setIsEditModalOpen(true)} className="bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"><Edit3 size={14} /> Manual Edit</button>
              </div>
            </div>

            {/* ✅ PREVIEW WITH LANGUAGE PROP */}
            <ResumePreview 
              data={activeResumeData} 
              baseData={baseResumeData} 
              isTailored={isTailoredView} 
              template={config.template} 
              showLogos={config.showLogos}
              language={config.language} 
            />
          </div>
        )}
      </div>

      {isEditModalOpen && activeResumeData && (
        <EditModal
          data={activeResumeData}
          onSave={handleManualSave}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};
