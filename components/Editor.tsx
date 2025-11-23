import React, { useState, useEffect } from 'react';
import { InputPanel } from './InputPanel';
import { ResumePreview } from './ResumePreview';
import { generateTailoredResume, parseBaseResume, updateResumeWithChat } from '../services/geminiService';
import { ResumeData, AppState, ResumeConfig, ChatMessage, FileInput, SavedResume, User } from '../types';
import { AlertCircle, FileText, Edit3, Layers, ArrowLeft, LogIn, Linkedin, Wand2, CheckCircle2, Zap } from 'lucide-react';
import { ChatAssistant } from './ChatAssistant';
import { EditModal } from './EditModal';
import { Logo } from './Logo';

interface EditorProps {
  initialResume?: SavedResume | null;
  onSave: (resume: SavedResume) => void;
  onBack: () => void;
  isGuest?: boolean;
  onRequireAuth: () => void;
  currentUser: User | null;
  onAddCredits: () => void;
}

export const Editor: React.FC<EditorProps> = ({ initialResume, onSave, onBack, isGuest, onRequireAuth, currentUser, onAddCredits }) => {
  
  // Inputs
  const [resumeId, setResumeId] = useState<string>(initialResume?.id || crypto.randomUUID());
  const [resumeTitle, setResumeTitle] = useState<string>(initialResume?.title || 'Untitled Resume');
  const [baseResumeInput, setBaseResumeInput] = useState<FileInput>(initialResume?.baseResumeInput || { type: 'text', content: '' });
  const [jobDescriptionInput, setJobDescriptionInput] = useState<FileInput>(initialResume?.jobDescriptionInput || { type: 'text', content: '' });
  
  const [appState, setAppState] = useState<AppState>(initialResume?.baseResumeData ? AppState.BASE_READY : AppState.IDLE);
  const [config, setConfig] = useState<ResumeConfig>(initialResume?.config || {
    length: 'standard',
    tone: 'standard',
    template: 'classic',
    refinementLevel: 50,
    showLogos: true,
    language: 'English'
  });
  const [profileImage, setProfileImage] = useState<string | undefined>(initialResume?.profileImage);

  // Data
  const [baseResumeData, setBaseResumeData] = useState<ResumeData | null>(initialResume?.baseResumeData || null);
  const [tailoredResumeData, setTailoredResumeData] = useState<ResumeData | null>(initialResume?.tailoredResumeData || null);
  
  const [viewMode, setViewMode] = useState<'base' | 'tailored'>('base');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat & Edit State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Update view mode if tailored data exists on load
  useEffect(() => {
    if (initialResume?.tailoredResumeData) {
      setViewMode('tailored');
      setAppState(AppState.TAILORED_READY);
    }
  }, [initialResume]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateBase = async () => {
    if (!baseResumeInput.content) return;

    setAppState(AppState.GENERATING_BASE);
    setErrorMsg(null);
    setTailoredResumeData(null);
    setViewMode('base');
    setChatMessages([]);

    try {
      const data = await parseBaseResume(baseResumeInput);
      setBaseResumeData(data);
      setAppState(AppState.BASE_READY);
      if (resumeTitle === 'Untitled Resume') {
        setResumeTitle(`${data.fullName}'s Resume`);
      }
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Failed to analyze base resume. Please try again.");
    }
  };

  const handleGenerateTailored = async () => {
    const sourceData = baseResumeData;
    if (!sourceData) return;

    setAppState(AppState.GENERATING_TAILORED);
    setErrorMsg(null);

    try {
      const data = await generateTailoredResume(sourceData, jobDescriptionInput, config);
      setTailoredResumeData(data);
      setAppState(AppState.TAILORED_READY);
      setViewMode('tailored');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: jobDescriptionInput.content ? "I've tailored your resume to the job description!" : `I've refined your resume style and language (${config.language}).`
      }]);
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
      setChatMessages([]);
      setViewMode('base');
    }
  };

  const handlePrint = (singlePage: boolean = false) => {
    const content = document.getElementById('resume-preview-content');
    if (!content) {
      alert("Resume content not found.");
      return;
    }
    const heightPx = content.scrollHeight;
    const heightMm = Math.ceil(heightPx * 0.264583) + 30;
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) return;

    const pageCss = singlePage 
      ? `@page { size: 210mm ${heightMm}mm; margin: 0; } body { margin: 0; } .resume-preview-container { padding: 15mm !important; box-shadow: none !important; }`
      : `@page { margin: 0.5cm; size: auto; }`;

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
          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 800); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const activeDataRaw = (viewMode === 'tailored' && tailoredResumeData) ? tailoredResumeData : baseResumeData;
  const activeResumeData = activeDataRaw ? { ...activeDataRaw, profileImage: profileImage || activeDataRaw.profileImage } : null;
  const isTailoredView = viewMode === 'tailored' && !!tailoredResumeData;
  const isLoading = appState === AppState.GENERATING_BASE || appState === AppState.GENERATING_TAILORED;

  const handleSendMessage = async (text: string) => {
    if (!activeResumeData) return;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setIsChatLoading(true);
    try {
      const result = await updateResumeWithChat(activeResumeData, text);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "I've drafted a change based on your request.",
        proposal: { data: result.data, description: result.description, status: 'pending' }
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't process that request." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAcceptProposal = (index: number) => {
    setChatMessages(prev => {
      const newMsgs = [...prev];
      const msg = newMsgs[index];
      if (msg.proposal && msg.proposal.status === 'pending') {
        msg.proposal.status = 'accepted';
        if (isTailoredView) setTailoredResumeData(msg.proposal.data);
        else setBaseResumeData(msg.proposal.data);
      }
      return newMsgs;
    });
  };

  const handleDeclineProposal = (index: number) => {
    setChatMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs[index].proposal) newMsgs[index].proposal!.status = 'declined';
      return newMsgs;
    });
  };

  const handleManualSave = (newData: ResumeData) => {
    if (isTailoredView) setTailoredResumeData(newData);
    else setBaseResumeData(newData);
  };

  const triggerSave = () => {
    const resumeToSave: SavedResume = {
      id: resumeId,
      title: resumeTitle,
      lastModified: Date.now(),
      baseResumeInput,
      jobDescriptionInput,
      baseResumeData,
      tailoredResumeData,
      config,
      profileImage
    };

    if (isGuest) {
      // Pass the current state up to app so it can save after auth
      onSave(resumeToSave); 
      onRequireAuth();
    } else {
      onSave(resumeToSave);
    }
  };

  const handleBack = () => {
    if (isGuest) {
      if (window.confirm("You are in Guest Mode. If you leave now, your unsaved changes will be lost. Do you want to Log In to save first?")) {
        onRequireAuth();
      } else {
         // They really want to leave/reset
         window.location.reload(); // Simple reset for guest
      }
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      <div className="w-full md:w-[400px] flex-shrink-0 h-[40vh] md:h-screen md:sticky md:top-0 z-10 shadow-xl bg-white flex flex-col border-r border-slate-200">
        {/* Header with Title and Save */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-2">
           <div className="flex items-center gap-2">
             <button onClick={handleBack} className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 flex-shrink-0" title="Back to Dashboard">
               <ArrowLeft size={20} />
             </button>
             <Logo iconOnly className="w-8 h-8" />
           </div>
           
           <input 
             value={resumeTitle}
             onChange={(e) => setResumeTitle(e.target.value)}
             className="text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 w-full min-w-0 truncate mx-2"
             placeholder="Untitled Resume"
           />
           
           <div className="flex items-center gap-2 flex-shrink-0">
             {isGuest ? (
               <button onClick={onRequireAuth} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded border border-indigo-200 flex items-center gap-1">
                 <LogIn size={12} /> Login
               </button>
             ) : (
                <button onClick={triggerSave} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded border border-indigo-200 flex items-center gap-1">
                  Save
                </button>
             )}
           </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          <InputPanel 
            baseResumeInput={baseResumeInput}
            setBaseResumeInput={setBaseResumeInput}
            jobDescriptionInput={jobDescriptionInput}
            setJobDescriptionInput={setJobDescriptionInput}
            onGenerateBase={handleGenerateBase}
            onGenerateTailored={handleGenerateTailored}
            onPrint={handlePrint}
            appState={appState}
            resetBase={handleResetBase}
            config={config}
            setConfig={setConfig}
            onImageUpload={handleImageUpload}
            profileImage={profileImage}
            userCredits={currentUser?.credits}
            onAddCredits={onAddCredits}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
          />
        </div>
      </div>

      <div className="flex-grow h-[60vh] md:h-screen overflow-y-auto bg-slate-200/50 p-4 md:p-8 relative">
        {/* SEO LANDING CONTENT - Visible when no data */}
        {!activeResumeData && !isLoading && appState !== AppState.ERROR && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <article className="max-w-2xl w-full text-center space-y-8 p-8">
              <Logo className="justify-center scale-150 mb-6" />
              
              <header className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
                   OneClick<span className="text-indigo-600">CV</span>Pro <br/>
                   <span className="text-xl md:text-2xl font-medium text-slate-500 block mt-2">The AI Resume Architect</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Transform your <strong className="text-slate-900">LinkedIn Profile</strong> into a perfect, ATS-ready resume in seconds. 
                  Customize it for any job application with a single click.
                </p>
              </header>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
                 <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                      <Linkedin size={20} />
                    </div>
                    <h2 className="font-bold text-slate-800 mb-1">LinkedIn Import</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">Save profile as PDF or copy text. We parse it instantly into structured data.</p>
                 </section>
                 <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3">
                      <Wand2 size={20} />
                    </div>
                    <h2 className="font-bold text-slate-800 mb-1">AI Tailoring</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">Paste a job description. We rewrite your resume to match keywords and pass ATS.</p>
                 </section>
                 <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-3">
                      <CheckCircle2 size={20} />
                    </div>
                    <h2 className="font-bold text-slate-800 mb-1">ATS Optimized</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">Clean, professional templates designed to be readable by hiring systems.</p>
                 </section>
              </div>
              
              <div className="pt-8">
                 <p className="text-sm font-bold text-indigo-600 flex items-center justify-center gap-2 animate-pulse">
                    <Zap size={16} /> Start on the left panel to begin
                 </p>
              </div>
            </article>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
             <p className="text-indigo-800 font-semibold animate-pulse">Processing...</p>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="w-full max-w-lg mx-auto mt-20 p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
            <AlertCircle className="text-red-600 mt-1" />
            <div><h3 className="font-bold text-red-800">Error</h3><p className="text-red-600 text-sm">{errorMsg}</p></div>
          </div>
        )}

        {activeResumeData && (
          <div className={isLoading ? 'opacity-30 blur-[1px]' : 'opacity-100'}>
            <div className="mb-4 flex items-center justify-between text-sm font-medium text-slate-500">
               <div className="bg-slate-200 p-1 rounded-lg flex text-xs font-bold shadow-inner">
                  <button onClick={() => setViewMode('base')} className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'base' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Layers size={12} /> Base
                  </button>
                  <button onClick={() => setViewMode('tailored')} disabled={!tailoredResumeData} className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${viewMode === 'tailored' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'} ${!tailoredResumeData ? 'opacity-50 cursor-not-allowed' : 'hover:text-slate-700'}`}>
                    <Layers size={12} /> Tailored
                  </button>
               </div>
               <button onClick={() => setIsEditModalOpen(true)} className="bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                  <Edit3 size={14} /> Manual Edit
               </button>
            </div>
            <ResumePreview data={activeResumeData} baseData={baseResumeData} isTailored={isTailoredView} template={config.template} showLogos={config.showLogos} />
          </div>
        )}
      </div>

      {activeResumeData && (
        <>
          <ChatAssistant messages={chatMessages} onSendMessage={handleSendMessage} onAcceptProposal={handleAcceptProposal} onDeclineProposal={handleDeclineProposal} isLoading={isChatLoading} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
          {isEditModalOpen && <EditModal data={activeResumeData} onSave={handleManualSave} onClose={() => setIsEditModalOpen(false)} />}
        </>
      )}
    </div>
  );
};