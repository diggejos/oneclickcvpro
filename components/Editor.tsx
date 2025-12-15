import React, { useState, useEffect, useRef } from 'react';
import { InputPanel } from './InputPanel';
import { ResumePreview } from './ResumePreview';
import { generateTailoredResume, parseBaseResume } from '../services/geminiService';
import {
  ResumeData,
  AppState,
  ResumeConfig,
  FileInput,
  SavedResume,
  User,
  PageView,
} from '../types';
import {
  AlertCircle,
  Layers,
  LogIn,
  Linkedin,
  Wand2,
  CheckCircle2,
  Zap,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { EditModal } from './EditModal';
import { Logo } from './Logo';
import { Footer } from './Footer';
import { EditorActions } from '../App';

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
  /* ------------------ STATE ------------------ */

  const [resumeId] = useState<string>(initialResume?.id || crypto.randomUUID());
  const [resumeTitle, setResumeTitle] = useState<string>(
    initialResume?.title || 'Untitled Resume'
  );

  const [baseResumeInput, setBaseResumeInput] = useState<FileInput>(
    initialResume?.baseResumeInput || { type: 'text', content: '' }
  );
  const [jobDescriptionInput, setJobDescriptionInput] = useState<FileInput>(
    initialResume?.jobDescriptionInput || { type: 'text', content: '' }
  );

  const [appState, setAppState] = useState<AppState>(
    initialResume?.baseResumeData ? AppState.BASE_READY : AppState.IDLE
  );

  const [config, setConfig] = useState<ResumeConfig>(
    initialResume?.config || {
      length: 'standard',
      tone: 'standard',
      template: 'classic',
      refinementLevel: 50,
      showLogos: true,
      language: 'English',
    }
  );

  const [profileImage, setProfileImage] = useState<string | undefined>(
    initialResume?.profileImage
  );

  const [baseResumeData, setBaseResumeData] = useState<ResumeData | null>(
    initialResume?.baseResumeData || null
  );
  const [tailoredResumeData, setTailoredResumeData] =
    useState<ResumeData | null>(
      initialResume?.tailoredResumeData || null
    );

  const [viewMode, setViewMode] = useState<'base' | 'tailored'>(
    initialResume?.tailoredResumeData ? 'tailored' : 'base'
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /* UX additions */
  const [isDirty, setIsDirty] = useState(false);
  const [saveToast, setSaveToast] =
    useState<null | 'saving' | 'saved' | 'error'>(null);

  const snapshotRef = useRef<SavedResume | null>(null);

  /* ------------------ HELPERS ------------------ */

  const buildSnapshot = (): SavedResume => ({
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

  /* ------------------ AUTOSNAPSHOT ------------------ */

  useEffect(() => {
    snapshotRef.current = buildSnapshot();
  }, [
    resumeTitle,
    baseResumeInput,
    jobDescriptionInput,
    baseResumeData,
    tailoredResumeData,
    config,
    profileImage,
  ]);

  /* ------------------ AUTOSAVE ON LEAVE ------------------ */

  useEffect(() => {
    return () => {
      if (isGuest) return;
      if (!isDirty) return;
      if (!snapshotRef.current) return;

      try {
        onSave(snapshotRef.current);
      } catch {}
    };
  }, [isDirty, isGuest, onSave]);

  /* ------------------ SAVE ------------------ */

  const triggerSave = async () => {
    try {
      setSaveToast('saving');

      const snapshot = buildSnapshot();
      snapshotRef.current = snapshot;

      onSave(snapshot);

      setIsDirty(false);
      setSaveToast('saved');
      setTimeout(() => setSaveToast(null), 1500);
    } catch {
      setSaveToast('error');
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  /* ------------------ GENERATION ------------------ */

  const handleGenerateBase = async () => {
    if (!baseResumeInput.content) return;

    setAppState(AppState.GENERATING_BASE);
    setErrorMsg(null);

    try {
      const data = await parseBaseResume(baseResumeInput);
      setBaseResumeData(data);
      setAppState(AppState.BASE_READY);
      setIsDirty(true);

      if (resumeTitle === 'Untitled Resume') {
        setResumeTitle(`${data.fullName}'s Resume`);
      }
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || 'Failed to analyze resume');
    }
  };

  const handleGenerateTailored = async () => {
    if (!baseResumeData) return;

    setAppState(AppState.GENERATING_TAILORED);
    setErrorMsg(null);

    try {
      const data = await generateTailoredResume(
        baseResumeData,
        jobDescriptionInput,
        config
      );
      setTailoredResumeData(data);
      setViewMode('tailored');
      setAppState(AppState.TAILORED_READY);
      setIsDirty(true);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || 'Failed to tailor resume');
    }
  };

  /* ------------------ RENDER ------------------ */

  const activeData =
    viewMode === 'tailored' && tailoredResumeData
      ? tailoredResumeData
      : baseResumeData;

  return (
    <div className="min-h-[calc(100vh-56px)] flex bg-slate-100">
      {/* LEFT PANEL */}
      <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col">

        {/* HEADER */}
        <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2 w-full">
            <Logo iconOnly className="w-7 h-7" />

            <input
              value={resumeTitle}
              onChange={(e) => {
                setResumeTitle(e.target.value);
                setIsDirty(true);
              }}
              className="text-sm font-semibold bg-transparent border-none focus:ring-0 w-full"
            />

            {isDirty && (
              <span
                className="w-2 h-2 rounded-full bg-amber-500"
                title="Unsaved changes"
              />
            )}
          </div>

          {isGuest ? (
            <button
              onClick={onRequireAuth}
              className="text-xs font-bold text-indigo-600"
            >
              <LogIn size={12} /> Login
            </button>
          ) : (
            <button
              onClick={triggerSave}
              className="text-xs font-bold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded"
            >
              Save
            </button>
          )}
        </div>

        <InputPanel
          baseResumeInput={baseResumeInput}
          setBaseResumeInput={(v) => {
            setBaseResumeInput(v);
            setIsDirty(true);
          }}
          jobDescriptionInput={jobDescriptionInput}
          setJobDescriptionInput={(v) => {
            setJobDescriptionInput(v);
            setIsDirty(true);
          }}
          onGenerateBase={handleGenerateBase}
          onGenerateTailored={handleGenerateTailored}
          onPrint={() => {}}
          appState={appState}
          resetBase={() => {}}
          config={config}
          setConfig={(v) => {
            setConfig(v);
            setIsDirty(true);
          }}
          onImageUpload={(file) => {
            const r = new FileReader();
            r.onloadend = () => {
              setProfileImage(r.result as string);
              setIsDirty(true);
            };
            r.readAsDataURL(file);
          }}
          profileImage={profileImage}
          userCredits={currentUser?.credits}
          onAddCredits={onAddCredits}
          isGuest={isGuest}
          onRequireAuth={onRequireAuth}
          onSpendCredit={onSpendCredit}
        />
      </div>

      {/* PREVIEW */}
      <div className="flex-grow p-8 overflow-auto">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
            {errorMsg}
          </div>
        )}

        {activeData && (
          <ResumePreview
            data={activeData}
            baseData={baseResumeData}
            isTailored={viewMode === 'tailored'}
            template={config.template}
            showLogos={config.showLogos}
          />
        )}
      </div>

      {/* SAVE TOAST */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="bg-white border shadow px-4 py-2 rounded flex items-center gap-2 text-sm">
            {saveToast === 'saving' && (
              <RotateCcw className="animate-spin" size={16} />
            )}
            {saveToast === 'saved' && (
              <CheckCircle2 size={16} className="text-green-600" />
            )}
            {saveToast === 'error' && (
              <AlertCircle size={16} className="text-red-600" />
            )}
            {saveToast === 'saving'
              ? 'Saving…'
              : saveToast === 'saved'
              ? 'Saved'
              : 'Save failed'}
          </div>
        </div>
      )}
    </div>
  );
};
