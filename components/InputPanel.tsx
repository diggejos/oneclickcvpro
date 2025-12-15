import React, { useRef, useState } from 'react';
import { FileText, Wand2, RotateCcw, Download, CheckCircle2, Edit2, Layout, Sliders, ImageIcon, RefreshCw, Zap, Building2, Languages, ScrollText, Lock, UploadCloud } from 'lucide-react';
import { AppState, ResumeConfig, TemplateId, ResumeLength, ResumeTone, FileInput, ResumeLanguage } from '../types';
import { FileDropZone } from './FileDropZone';
import { CreditConfirmModal } from "./CreditConfirmModal";


interface InputPanelProps {
  baseResumeInput: FileInput;
  setBaseResumeInput: (val: FileInput) => void;
  jobDescriptionInput: FileInput;
  setJobDescriptionInput: (val: FileInput) => void;
  onGenerateBase: () => void;
  onGenerateTailored: () => void;
  onPrint: (singlePage: boolean) => void;
  appState: AppState;
  resetBase: () => void;
  config: ResumeConfig;
  setConfig: React.Dispatch<React.SetStateAction<ResumeConfig>>;
  onImageUpload: (file: File) => void;
  profileImage: string | undefined;
  
  // Premium Props
  userCredits?: number;
  onAddCredits: () => void;
  isGuest?: boolean;
  onRequireAuth: () => void;
  onSpendCredit: (reason: string) => Promise<number>;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  baseResumeInput,
  setBaseResumeInput,
  jobDescriptionInput,
  setJobDescriptionInput,
  onGenerateBase,
  onGenerateTailored,
  onPrint,
  appState,
  resetBase,
  config,
  setConfig,
  onImageUpload,
  profileImage,
  userCredits,
  onAddCredits,
  isGuest,
  onRequireAuth,
  onSpendCredit
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [singlePageMode, setSinglePageMode] = useState(false);

  const isBaseReady = appState !== AppState.IDLE && appState !== AppState.GENERATING_BASE && appState !== AppState.ERROR;
  const isGeneratingBase = appState === AppState.GENERATING_BASE;
  const isProcessing = appState === AppState.GENERATING_BASE || appState === AppState.GENERATING_TAILORED;
  const isTailored = appState === AppState.TAILORED_READY;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [confirmLabel, setConfirmLabel] = useState("");
  const [confirmCost, setConfirmCost] = useState(1);

  const hasJobDescription = jobDescriptionInput.content.length > 0;

  // --- Premium Logic ---
  // Cost is 1 credit for AI generation/tailoring
  const CREDIT_COST = 1;
  const canAfford = (userCredits || 0) >= CREDIT_COST;

  // ✅ NEW: Guards to ensure LOGIN happens before credit modal
  const requireLoginFirst = () => {
    if (isGuest) {
      onRequireAuth();
      return true;
    }
    return false;
  };

  // ✅ NEW: Guard to ensure PRICING happens before credit modal (if insufficient credits)
  const requireCreditsFirst = () => {
    if (!canAfford) {
      onAddCredits();
      return true;
    }
    return false;
  };
  
  const handlePremiumAction = async () => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
  
    try {
      await onSpendCredit(hasJobDescription ? "ai_tailor" : "ai_refine_translate");
      onGenerateTailored();
    } catch (err: any) {
      if (err?.status === 402) {
        onAddCredits(); // only if truly insufficient credits
      } else {
        alert(err?.message || "Something went wrong while spending credits.");
        console.error(err);
      }
    }
  };

  const requestCreditConfirm = (
      label: string,
      cost: number,
      action: () => Promise<void>
    ) => {
      setConfirmLabel(label);
      setConfirmCost(cost);
      setConfirmAction(() => action);
      setConfirmOpen(true);
    };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const supportedLanguages: ResumeLanguage[] = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Chinese', 'Japanese'];

  return (
    <div className="h-full flex flex-col bg-slate-50 border-r border-slate-200">
      
      <div className="space-y-6 flex-grow px-6 py-6 pb-6">
        
        {/* Section 1: Base CV Setup */}
        <div className={`transition-all duration-500 ${isBaseReady ? 'bg-white p-4 rounded-xl border border-indigo-100 shadow-sm' : ''}`}>
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <div className={`w-2 h-2 rounded-full ${isBaseReady ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                Base Resume Data
             </div>
            {isBaseReady && (
               <button onClick={resetBase} className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                 <Edit2 size={12} /> Change Source
               </button>
            )}
          </div>

          {!isBaseReady ? (
            <div className="relative animate-in fade-in space-y-4">
              
              {/* 1. Profile Picture - Made distinct */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="flex-shrink-0">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                    <button 
                      onClick={handleImageClick}
                      className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden relative group
                        ${profileImage ? 'border-indigo-500' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 border-dashed'}`}
                    >
                      {profileImage ? (
                        <>
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Edit2 size={16} className="text-white"/>
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={24} className="text-slate-400" />
                      )}
                    </button>
                 </div>
                 <div className="flex-grow">
                    <label className="block text-xs font-bold text-slate-700 mb-0.5">Profile Photo (Optional)</label>
                    <p className="text-[10px] text-slate-500 mb-2 leading-tight">Add a professional headshot to your resume.</p>
                    <button onClick={handleImageClick} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1">
                       <UploadCloud size={12}/> {profileImage ? 'Change Photo' : 'Upload Image'}
                    </button>
                 </div>
              </div>

              {/* 2. Content Input - Clarified Text */}
              <div>
                <FileDropZone 
                  label="Resume Content" 
                  value={baseResumeInput} 
                  onChange={setBaseResumeInput}
                  placeholder="Paste your Bio, Work History, LinkedIn Summary, or drag & drop any PDF resume here. Our AI will structure it automatically."
                />
              </div>
              
              <button
                onClick={onGenerateBase}
                disabled={isGeneratingBase || !baseResumeInput.content}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-white text-sm shadow-md transition-all
                  ${isGeneratingBase || !baseResumeInput.content 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-slate-800 hover:bg-slate-900'
                  }`}
              >
                {isGeneratingBase ? <RotateCcw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                {isGeneratingBase ? 'Analyzing Content...' : 'Analyze & Create Base Resume'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="truncate max-w-[150px]">
                   {baseResumeInput.type === 'file' ? baseResumeInput.fileName : 'Text Content Extracted'}
                </span>
              </div>
              {profileImage && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-100 shadow-sm">
                   <img src={profileImage} alt="Mini profile" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Tailoring & Options */}
        {isBaseReady && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Job Description Input */}
            <div>
               <FileDropZone 
                label="Target Job (Optional)" 
                value={jobDescriptionInput} 
                onChange={setJobDescriptionInput}
                placeholder="Paste the Job Description text here (or drag PDF) to tailor your resume specifically for this role..."
              />
            </div>

            {/* Settings Block - Always visible now if Base is ready */}
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-4">
               <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs border-b border-slate-200 pb-2 mb-2">
                 <Sliders size={14} /> Style Configuration
               </div>

               {/* Language Selector */}
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Languages size={12} /> Language</span>
                 </div>
                 <select
                    value={config.language}
                    onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value as ResumeLanguage }))}
                    className="w-full p-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                 >
                    {supportedLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                 </select>
               </div>
              
               {/* AI Rewrite Intensity Slider */}
               <div className="space-y-2 pt-2 border-t border-slate-200 border-dashed">
                 <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500"/> AI Rewrite Intensity</span>
                    <span className="text-indigo-600">{config.refinementLevel}%</span>
                 </div>
                 <input 
                   type="range" 
                   min="0" max="100" 
                   step="10"
                   value={config.refinementLevel}
                   onChange={(e) => setConfig(prev => ({ ...prev, refinementLevel: parseInt(e.target.value) }))}
                   className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
                 <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                   <span>Keep Original</span>
                   <span>Full Rewrite</span>
                 </div>
               </div>

               {/* Tone Slider */}
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    <span>Tone</span>
                    <span className="text-indigo-600">{config.tone}</span>
                 </div>
                 <input 
                   type="range" 
                   min="1" max="3" 
                   step="1"
                   value={config.tone === 'corporate' ? 1 : config.tone === 'standard' ? 2 : 3}
                   onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const map: Record<number, ResumeTone> = { 1: 'corporate', 2: 'standard', 3: 'creative' };
                      setConfig(prev => ({ ...prev, tone: map[val] }));
                   }}
                   className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
                 <div className="flex justify-between text-[10px] text-slate-400">
                   <span>Corp</span>
                   <span>Creative</span>
                 </div>
               </div>

               {/* Length Slider */}
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    <span>Length</span>
                    <span className="text-indigo-600">{config.length}</span>
                 </div>
                 <input 
                   type="range" 
                   min="1" max="3" 
                   step="1"
                   value={config.length === 'concise' ? 1 : config.length === 'standard' ? 2 : 3}
                   onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const map: Record<number, ResumeLength> = { 1: 'concise', 2: 'standard', 3: 'detailed' };
                      setConfig(prev => ({ ...prev, length: map[val] }));
                   }}
                   className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
                  <div className="flex justify-between text-[10px] text-slate-400">
                   <span>Short</span>
                   <span>Long</span>
                 </div>
               </div>

               {/* Logo Toggle */}
               <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    <Building2 size={12} /> Show Logos
                  </div>
                  <button 
                    onClick={() => setConfig(prev => ({ ...prev, showLogos: !prev.showLogos }))}
                    className={`w-8 h-4 rounded-full transition-colors relative ${config.showLogos ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${config.showLogos ? 'left-4.5 translate-x-0' : 'left-0.5'}`} style={{ left: config.showLogos ? 'calc(100% - 0.85rem)' : '0.125rem' }}></span>
                  </button>
               </div>
            </div>
            
            {/* Generate / Tailor Button (PREMIUM) */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (requireLoginFirst()) return;
                  if (requireCreditsFirst()) return;

                  requestCreditConfirm(
                    hasJobDescription ? "Tailor resume to job" : "Refine / translate resume",
                    1,
                    async () => {
                      await onSpendCredit(
                        hasJobDescription ? "ai_tailor" : "ai_refine_translate"
                      );
                      onGenerateTailored();
                    }
                  );
                }}
                disabled={isProcessing}
                className={`relative w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-white shadow-md transition-all overflow-hidden group
                  ${isProcessing 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : canAfford || isGuest ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <RotateCcw className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    {hasJobDescription ? (
                      <><Wand2 size={18} /> {isTailored ? 'Regenerate Tailored' : 'Tailor to Job'}</>
                    ) : (
                      <><RefreshCw size={18} /> Refine / Translate</>
                    )}
                    
                    {/* Cost Badge */}
                    {!isProcessing && (
                       <span className="ml-2 bg-black/20 px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1">
                         <Zap size={10} className="fill-yellow-400 text-yellow-400"/> 
                         1
                       </span>
                    )}
                  </>
                )}
                
                {/* Lock Overlay if not guest and cannot afford */}
                {!isGuest && !canAfford && !isProcessing && (
                   <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center gap-2 backdrop-blur-[1px] transition-opacity opacity-0 group-hover:opacity-100">
                      <Lock size={16} /> Purchase Credits
                   </div>
                )}
              </button>

              {!isGuest && !canAfford && (
                <p className="text-[10px] text-red-500 text-center font-medium">
                   Insufficient credits. Click to top up.
                </p>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Templates & Actions */}
      <div className="p-6 pt-4 border-t border-slate-200 bg-white">
         <div className="mb-4">
             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2">
                <Layout size={14} /> Template Style
             </label>
             <div className="grid grid-cols-3 gap-2">
               {(['classic', 'modern', 'minimal'] as TemplateId[]).map(t => (
                 <button
                    key={t}
                    onClick={() => setConfig(prev => ({ ...prev, template: t }))}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wide border rounded-md transition-all
                      ${config.template === t 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' 
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                 >
                   {t}
                 </button>
               ))}
             </div>
         </div>

        {isBaseReady && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={singlePageMode}
                  onChange={(e) => setSinglePageMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                <ScrollText size={12} /> Single Page PDF (Continuous)
              </span>
            </label>

          <button
            onClick={() => {
              if (requireLoginFirst()) return;
              if (requireCreditsFirst()) return;

              requestCreditConfirm(
                "Export resume as PDF",
                1,
                async () => {
                  await onSpendCredit("pdf_download");
                  onPrint(singlePageMode);
                }
              );
            }}
            className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-indigo-600 transition-all"
          >
            <Download size={18} />
            Print / Save as PDF
          
            <span className="ml-2 bg-black/20 px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1">
              <Zap size={10} className="fill-yellow-400 text-yellow-400" />
              1
            </span>
          </button>

          </div>
        )}
        
        <p className="text-center text-[10px] text-slate-400 mt-4">
          Powered by Gemini 2.5 Flash
        </p>
      </div>

      <CreditConfirmModal
      open={confirmOpen}
      credits={userCredits || 0}
      cost={confirmCost}
      actionLabel={confirmLabel}
      onCancel={() => setConfirmOpen(false)}
      onConfirm={async () => {
        setConfirmOpen(false);
        if (confirmAction) await confirmAction();
      }}
    />
    </div>
  );
};
