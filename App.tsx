import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import { AuthPage } from "./components/AuthPage";
import { Dashboard } from "./components/Dashboard";
import { Editor } from "./components/Editor";
import { PricingModal } from "./components/PricingModal";
import { BlogPage } from "./components/BlogPage";
import { AboutPage } from "./components/AboutPage";
import { LegalPage } from "./components/LegalPage";
import { PricingPage } from "./components/PricingPage";
import { ContactPage } from "./components/ContactPage";
import { ProductPage } from "./components/ProductPage";
import { GlobalChatAssistant } from "./components/GlobalChatAssistant";
import { unifiedChatAgent } from "./services/geminiService";
import VerifyEmailPage from "./components/VerifyEmailPage";
import VerifiedPage from "./components/VerifiedPage";
import { TopNav } from "./components/TopNav";

import {
  User,
  SavedResume,
  PageView,
  ChatMessage,
  ResumeData,
  LegalPageType,
  ProductType,
} from "./types";

const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || "";
const STORAGE_KEY_USER = "oneclickcv_user";

export interface EditorActions {
  getResume: () => ResumeData | null;
  updateResume: (data: ResumeData) => void;
  isTailored: () => boolean;
  previewResume: (data: ResumeData) => void;
  clearPreview: () => void;
  isPreviewing: () => boolean;
}

// Helper to calculate paths
const toPath = (page: PageView, sub?: any) => {
  switch (page) {
    case "dashboard": return "/dashboard";
    case "editor": return "/editor";
    case "about": return "/about";
    case "contact": return "/contact";
    case "pricing": return "/pricing";
    case "blog": return "/blog";
    case "legal": return sub ? `/legal/${sub}` : "/legal";
    case "product": return sub ? `/product/${sub}` : "/product";
    case "home":
    default: return "/";
  }
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [subPage, setSubPage] = useState<any>(null);

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const viewFromPath: PageView =
    path === "/dashboard" ? "dashboard"
      : path === "/editor" ? "editor"
      : path === "/about" ? "about"
      : path === "/contact" ? "contact"
      : path === "/pricing" ? "pricing"
      : path.startsWith("/legal") ? "legal"
      : path.startsWith("/product") ? "product"
      : path === "/blog" ? "blog"
      : "home";

  // Lazy init user
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResume, setCurrentResume] = useState<SavedResume | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pendingResumeSave, setPendingResumeSave] = useState<SavedResume | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const editorActionsRef = useRef<EditorActions | null>(null);
  const [editorSessionKey, setEditorSessionKey] = useState(0);

  // --- HELPER: Fetch latest user data ---
  const fetchMe = async (userId: string) => {
    if (!BACKEND_URL) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/me?t=${Date.now()}`, {
        headers: { "x-user-id": userId },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      const credits = data?.credits ?? data?.user?.credits;
      // Ensure we strictly return a number, or null if undefined
      return typeof credits === 'number' ? credits : null;
    } catch {
      return null;
    }
  };

  const updateCreditsInState = (newCredits: number) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      if (currentUser.credits === newCredits) return currentUser; // No change
      
      const updated = { ...currentUser, credits: newCredits };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      return updated;
    });
  };

  // --- PAYMENT & LOAD LOGIC ---
  useEffect(() => {
    if (user?.id) fetchResumesFromDB(user.id);

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("success") === "true";
    const sessionId = params.get("session_id");

    const runVerification = async () => {
       if (!user?.id || !sessionId) return;

       // A) Fast Path: Manual Verification with Retry
       for (let i = 0; i < 3; i++) {
          try {
             // console.log(`[Verify] Attempt ${i + 1} for session ${sessionId}`);
             const res = await fetch(`${BACKEND_URL}/api/credits/verify-session?t=${Date.now()}`, {
               method: "POST",
               headers: { "Content-Type": "application/json", "x-user-id": user.id },
               body: JSON.stringify({ sessionId })
             });
             const data = await res.json();
             
             if (data.success && typeof data.credits === 'number') {
                updateCreditsInState(data.credits);
                window.history.replaceState({}, "", window.location.pathname);
                alert(`Payment Successful! Balance: ${data.credits} credits.`);
                return;
             }
          } catch(e) { console.error("Verify fetch error", e); }
          await new Promise((r) => setTimeout(r, 1000));
       }
       window.history.replaceState({}, "", window.location.pathname);
    };

    if (isSuccess && user) {
       runVerification();
    }
  }, []); 

  // --- BACKGROUND HEARTBEAT ---
  useEffect(() => {
    if (!user?.id) return;
    
    // Initial fetch on mount
    fetchMe(user.id).then(c => { if(c !== null) updateCreditsInState(c) });

    const interval = setInterval(async () => {
      try {
        const credits = await fetchMe(user.id);
        if (credits !== null && Number.isFinite(credits)) {
          updateCreditsInState(credits);
        }
      } catch (e) { /* silent */ }
    }, 4000); 
    return () => clearInterval(interval);
  }, [user?.id]);


  // SEO
  useEffect(() => {
    let title = "OneClickCVPro | Instant AI Resume Builder";
    if (viewFromPath === "dashboard") title = "My Dashboard | OneClickCVPro";
    else if (viewFromPath === "pricing") title = "Pricing | OneClickCVPro";
    document.title = title;
  }, [viewFromPath, subPage]);

  // --- CRUD Operations ---
  const fetchResumesFromDB = async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/resumes`, {
        headers: { "x-user-id": userId },
      });
      if (res.ok) setSavedResumes(await res.json());
    } catch (e) { console.error(e); }
  };

  const syncResumeToDB = async (resume: SavedResume, userId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/resumes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(resume),
      });
      fetchResumesFromDB(userId);
    } catch (e) { console.error(e); }
  };

  const deleteResumeFromDB = async (resumeId: string, userId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/resumes/${resumeId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      fetchResumesFromDB(userId);
    } catch (e) { console.error(e); }
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
      navigate("/dashboard");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setSavedResumes([]);
    setCurrentResume(null);
    navigate("/editor", { replace: true });
    editorActionsRef.current = null;
  };

  const handleNavigate = (page: PageView, sub?: any) => {
    setSubPage(sub || null);
    navigate(toPath(page, sub));
  };

  // --- Chat ---
  const handleChatSendMessage = async (text: string) => {
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setIsChatLoading(true);
    try {
      const currentResumeData = editorActionsRef.current?.getResume() || null;
      const history = ([
        ...chatMessages,
        { role: "user", text },
      ] as any[]).map((m) => ({ role: m.role as "user" | "model", text: m.text }));
  
      const result = await unifiedChatAgent(history, text, currentResumeData);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.text,
          proposal: result.proposal ? { ...result.proposal, status: "pending" } : undefined,
        },
      ]);
      if (result.proposal?.data) editorActionsRef.current?.previewResume?.(result.proposal.data);
    } catch (e: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Service unavailable." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatAcceptProposal = (index: number) => {
    const msg = chatMessages[index];
    if (msg.proposal) {
      setChatMessages((prev) => {
        const n = [...prev]; n[index].proposal!.status = "accepted"; return n;
      });
      editorActionsRef.current?.updateResume(msg.proposal.data);
      editorActionsRef.current?.clearPreview?.();
    }
  };

  const handleChatDeclineProposal = (index: number) => {
    setChatMessages((prev) => {
      const n = [...prev]; if (n[index].proposal) n[index].proposal!.status = "declined"; return n;
    });
    editorActionsRef.current?.clearPreview?.();
  };

  const spendCredit = async (reason: string) => {
    if (!user) throw Object.assign(new Error("Not logged in"), { status: 401 });
    const res = await fetch(`${BACKEND_URL}/api/credits/spend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error);
    updateUserState({ ...user, credits: data.credits });
    return data.credits;
  };

  const handleCreateNew = () => { setCurrentResume(null); navigate("/editor"); };
  const handleOpenResume = (r: SavedResume) => { setCurrentResume(r); navigate("/editor"); };
  const handleDeleteResume = (id: string) => {
    if (window.confirm("Delete?")) user ? deleteResumeFromDB(id, user.id) : setSavedResumes(p => p.filter(x => x.id !== id));
  };
  const handleSaveResume = (r: SavedResume) => {
    if (!user) { setPendingResumeSave(r); setShowAuthModal(true); return; }
    syncResumeToDB(r, user.id);
    setSavedResumes(p => { const i = p.findIndex(x => x.id === r.id); if (i >= 0) p[i] = r; else p.push(r); return [...p]; });
    setCurrentResume(r);
  };

  const handleCreditsPurchased = (newCredits: number) => {
    if (user) updateUserState({ ...user, credits: newCredits });
    setShowPricingModal(false);
  };

  const RequireUser: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (user) return <>{children}</>;
    if (!showAuthModal) setShowAuthModal(true);
    return <Navigate to="/editor" replace />;
  };

  return (
    <>
      <TopNav
        user={user}
        credits={user?.credits}
        onAddCredits={() => setShowPricingModal(true)}
        onLogout={handleLogout}
        onLogin={() => setShowAuthModal(true)}
        onNavigate={handleNavigate}
        onBack={path === "/editor" && user ? () => navigate("/dashboard") : undefined}
      />
      <Routes>
        <Route path="/verified" element={<VerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={
          <Editor
            key={`${editorSessionKey}-${user?.id ?? "guest"}`}
            initialResume={currentResume}
            onSave={handleSaveResume}
            onBack={() => user ? navigate("/dashboard") : setShowAuthModal(true)}
            isGuest={!user}
            onRequireAuth={() => setShowAuthModal(true)}
            currentUser={user}
            onAddCredits={() => setShowPricingModal(true)}
            onNavigate={handleNavigate}
            onRegisterActions={(a) => (editorActionsRef.current = a)}
            onSpendCredit={spendCredit}
          />
        } />
        <Route path="/dashboard" element={<RequireUser><Dashboard user={user!} resumes={savedResumes} onCreate={handleCreateNew} onOpen={handleOpenResume} onDelete={handleDeleteResume} onLogout={handleLogout} onAddCredits={() => setShowPricingModal(true)} onNavigate={handleNavigate} /></RequireUser>} />
        <Route path="/about" element={<AboutPage onBack={() => navigate(user ? "/dashboard" : "/editor")} />} />
        <Route path="/contact" element={<ContactPage onBack={() => navigate(user ? "/dashboard" : "/editor")} />} />
        
        {/* Pricing Route */}
        <Route path="/pricing" element={
          <PricingPage 
            onBack={() => navigate(user ? "/dashboard" : "/editor")} 
            onGetStarted={() => navigate("/editor")} 
            onBuy={() => {
              if (user) setShowPricingModal(true);
              else setShowAuthModal(true);
            }}
          />
        } />
        
        <Route path="/blog" element={<BlogPage onBack={() => navigate(user ? "/dashboard" : "/editor")} initialPostId={subPage} />} />
        <Route path="/legal/:type" element={<LegalPage type={subPage as LegalPageType} onBack={() => navigate(user ? "/dashboard" : "/editor")} />} />
        <Route path="/product/:type" element={<ProductPage type={subPage as ProductType} onBack={() => navigate(user ? "/dashboard" : "/editor")} onStart={() => navigate("/editor")} />} />
        <Route path="*" element={<Navigate to="/editor" replace />} />
      </Routes>
      
      <GlobalChatAssistant 
        messages={chatMessages} 
        isOpen={isChatOpen} 
        setIsOpen={setIsChatOpen} 
        isLoading={isChatLoading} 
        onSendMessage={handleChatSendMessage} 
        onAcceptProposal={handleChatAcceptProposal} 
        onDeclineProposal={handleChatDeclineProposal} 
        hasActiveResume={path === "/editor" && !!editorActionsRef.current} 
        
        // Pass Props with Default
        isGuest={!user}
        userCredits={user?.credits ?? 0}
        onLogin={() => setShowAuthModal(true)}
        onAddCredits={() => setShowPricingModal(true)}
      />

      {showAuthModal && <AuthPage onLogin={handleLogin} isModal={true} onClose={() => setShowAuthModal(false)} />}
      {showPricingModal && user && <PricingModal onClose={() => setShowPricingModal(false)} currentCredits={user.credits} onPurchase={handleCreditsPurchased} userId={user.id} />}
    </>
  );
};

export default App;
