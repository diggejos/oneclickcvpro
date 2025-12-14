import React, { useState, useEffect, useRef } from 'react';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { PricingModal } from './components/PricingModal';
import { BlogPage } from './components/BlogPage';
import { AboutPage } from './components/AboutPage';
import { LegalPage } from './components/LegalPage';
import { PricingPage } from './components/PricingPage';
import { ContactPage } from './components/ContactPage';
import { ProductPage } from './components/ProductPage';
import { GlobalChatAssistant } from './components/GlobalChatAssistant';
import { unifiedChatAgent } from './services/geminiService';
import { User, SavedResume, PageView, LegalPageType, ProductType, ChatMessage, ResumeData } from './types';
import VerifyEmailPage from './components/VerifyEmailPage';
import VerifiedPage from './components/VerifiedPage';
import { TopNav } from "./components/TopNav";



const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || "";
const STORAGE_KEY_USER = 'oneclickcv_user';

export interface EditorActions {
  getResume: () => ResumeData | null;
  updateResume: (data: ResumeData) => void;
  isTailored: () => boolean;
}



const App: React.FC = () => {
  const [view, setView] = useState<PageView>('editor');
  const [subPage, setSubPage] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResume, setCurrentResume] = useState<SavedResume | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pendingResumeSave, setPendingResumeSave] = useState<SavedResume | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const editorActionsRef = useRef<EditorActions | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchResumesFromDB(parsedUser.id);
    }
  
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      (async () => {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
        if (!current?.id) {
          alert("Payment successful. Please log in again to refresh credits.");
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }
  
        const before = Number(current.credits || 0);
        let latest = before;
  
        // Poll max ~10s: warten bis Webhook DB updated hat
        for (let attempt = 0; attempt < 10; attempt++) {
          try {
            const res = await fetch(`${BACKEND_URL}/api/users/me`, {
              headers: { "x-user-id": current.id },
            });
            const data = await res.json();
  
            if (res.ok && typeof data.credits === "number") {
              latest = data.credits;
  
              // state + localstorage updaten
              updateUserState({ ...current, credits: latest });
  
              // stop wenn credits wirklich hoch gingen
              if (latest > before) break;
            }
          } catch {
            // ignore
          }
  
          await new Promise((r) => setTimeout(r, 1000));
        }
  
        alert(
          latest > before
            ? `Payment successful! Credits updated: ${before} → ${latest}`
            : "Payment successful! Credits will appear shortly. If not, reload once."
        );
  
        window.history.replaceState({}, "", window.location.pathname);
      })();
    }
  }, []);


  useEffect(() => {
    let title = "OneClickCVPro | Instant AI Resume Builder";
    if (view === 'about') title = "About Us | OneClickCVPro";
    else if (view === 'blog') title = "Career Blog | OneClickCVPro";
    else if (view === 'pricing') title = "Pricing | OneClickCVPro";
    else if (view === 'contact') title = "Contact Support | OneClickCVPro";
    else if (view === 'dashboard') title = "My Dashboard | OneClickCVPro";
    document.title = title;
  }, [view, subPage]);

  const fetchResumesFromDB = async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/resumes`, {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedResumes(data);
      }
    } catch (e) {
      console.error("Failed to load resumes", e);
    }
  };

  const syncResumeToDB = async (resume: SavedResume, userId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(resume)
      });
      fetchResumesFromDB(userId);
    } catch (e) {
      console.error("Failed to sync resume", e);
    }
  };

  const deleteResumeFromDB = async (resumeId: string, userId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      fetchResumesFromDB(userId);
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const updateUserState = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  };

  const handleLogin = (loggedInUser: User) => {
    updateUserState(loggedInUser);
    fetchResumesFromDB(loggedInUser.id);
    setShowAuthModal(false);

    if (pendingResumeSave) {
      syncResumeToDB(pendingResumeSave, loggedInUser.id);
      setPendingResumeSave(null);
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setSavedResumes([]);
    setView('editor');
    setCurrentResume(null);
  };

  const handleNavigate = (page: PageView, sub?: any) => {
    setView(page);
    setSubPage(sub || null);
  };

  const handleChatSendMessage = async (text: string) => {
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setIsChatLoading(true);
    try {
      const currentResumeData = editorActionsRef.current?.getResume() || null;
      const history = chatMessages.map(m => ({ role: m.role as 'user' | 'model', text: m.text }));
      const result = await unifiedChatAgent(history, text, currentResumeData);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: result.text,
        proposal: result.proposal ? { data: result.proposal.data, description: result.proposal.description, status: 'pending' } : undefined
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Service unavailable." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const spendCredit = async (reason: string) => {
    if (!user) throw Object.assign(new Error("Not logged in"), { status: 401 });
  
    const res = await fetch(`${BACKEND_URL}/api/credits/spend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({ reason }),
    });
  
    const data = await res.json().catch(() => null);
  
    if (!res.ok) {
      const err = new Error(data?.error || "Credit spend failed");
      // attach status for UI logic
      (err as any).status = res.status;
      throw err;
    }
  
    const updatedUser = { ...user, credits: data.credits };
    updateUserState(updatedUser);
    return data.credits;
  };


  const handleChatAcceptProposal = (index: number) => {
    const msg = chatMessages[index];
    if (msg.proposal && msg.proposal.status === 'pending') {
      setChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[index].proposal!.status = 'accepted';
        return newMsgs;
      });
      if (editorActionsRef.current) {
        editorActionsRef.current.updateResume(msg.proposal.data);
      }
    }
  };

  const handleChatDeclineProposal = (index: number) => {
    setChatMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs[index].proposal) newMsgs[index].proposal!.status = 'declined';
      return newMsgs;
    });
  };

  const handleCreateNew = () => {
    setCurrentResume(null);
    setView('editor');
  };

  const handleOpenResume = (resume: SavedResume) => {
    setCurrentResume(resume);
    setView('editor');
  };

  const handleDeleteResume = (id: string) => {
    if (window.confirm('Delete this resume?')) {
      if (user) {
        deleteResumeFromDB(id, user.id);
      } else {
        const updated = savedResumes.filter(r => r.id !== id);
        setSavedResumes(updated);
      }
    }
  };

  const handleSaveResume = (resume: SavedResume) => {
    if (!user) {
      setPendingResumeSave(resume);
      setShowAuthModal(true);
      return;
    }

    syncResumeToDB(resume, user.id);

    const existingIndex = savedResumes.findIndex(r => r.id === resume.id);
    if (existingIndex >= 0) {
      const updated = [...savedResumes];
      updated[existingIndex] = resume;
      setSavedResumes(updated);
    } else {
      setSavedResumes([...savedResumes, resume]);
    }
    setCurrentResume(resume);
  };

  const handleAddCredits = (amount: number) => {
    if (!user) return;
    setShowPricingModal(false);
  };

  let ContentComponent;
  const path = window.location.pathname.replace(/\/+$/, ""); // remove trailing slash

  if (path === "/verified") {
    return <VerifiedPage />;
  }


  if (view === 'about') ContentComponent = <AboutPage onBack={() => handleNavigate(user ? 'dashboard' : 'editor')} />;
  else if (view === 'contact') ContentComponent = <ContactPage onBack={() => handleNavigate(user ? 'dashboard' : 'editor')} />;
  else if (view === 'product') ContentComponent = <ProductPage type={subPage as ProductType} onBack={() => handleNavigate(user ? 'dashboard' : 'editor')} onStart={() => handleNavigate('editor')} />;
  else if (view === 'blog') ContentComponent = <BlogPage onBack={() => handleNavigate(user ? 'dashboard' : 'editor')} initialPostId={subPage} />;
  else if (view === 'pricing') ContentComponent = <PricingPage onBack={() => handleNavigate(user ? 'dashboard' : 'editor')} onGetStarted={() => handleNavigate('editor')} />;
  else if (view === 'legal') ContentComponent = <LegalPage type={subPage as LegalPageType} onBack={() => handleNavigate(user ? 'dashboard' : 'editor')} />;
  else if ((view === 'dashboard' || view === 'home') && user) {
    ContentComponent = (
      <Dashboard
        user={user}
        resumes={savedResumes}
        onCreate={handleCreateNew}
        onOpen={handleOpenResume}
        onDelete={handleDeleteResume}
        onLogout={handleLogout}
        onAddCredits={() => setShowPricingModal(true)}
        onNavigate={handleNavigate}
      />
    );
  } else {
    ContentComponent = (
      <Editor
        initialResume={currentResume}
        onSave={handleSaveResume}
        onBack={() => {
          if (user) {
            setView('dashboard');
          } else {
            setShowAuthModal(true);
          }
        }}
        isGuest={!user}
        onRequireAuth={() => setShowAuthModal(true)}
        currentUser={user}
        onAddCredits={() => setShowPricingModal(true)}
        onNavigate={handleNavigate}
        onRegisterActions={(actions) => { editorActionsRef.current = actions; }}
        onSpendCredit={spendCredit}
      />
    );
  }

  return (
    <>
      <TopNav
        user={user}
        onAddCredits={() => setShowPricingModal(true)}
        onLogout={handleLogout}
        onLogin={() => setShowAuthModal(true)}
        onNavigate={handleNavigate}
        onBack={view === "editor" && user ? () => setView("dashboard") : undefined}
      />
      {ContentComponent}

      <GlobalChatAssistant
        messages={chatMessages}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        isLoading={isChatLoading}
        onSendMessage={handleChatSendMessage}
        onAcceptProposal={handleChatAcceptProposal}
        onDeclineProposal={handleChatDeclineProposal}
        hasActiveResume={view === 'editor' && !!editorActionsRef.current}
      />

      {showAuthModal && (
        <AuthPage
          onLogin={handleLogin}
          isModal={true}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showPricingModal && user && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          currentCredits={user.credits}
          onPurchase={handleAddCredits}
          userId={user.id}
        />
      )}
    </>
  );
};

export default App;
