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
  LegalPageType,
  ProductType,
  ChatMessage,
  ResumeData,
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
  const [editorSessionKey, setEditorSessionKey] = useState(0);

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

  // --- IMMEDIATE PAYMENT VERIFICATION ---
  useEffect(() => {
    // 1. Load initial user
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    let currentUserData = null;
    if (storedUser) {
      currentUserData = JSON.parse(storedUser);
      setUser(currentUserData);
      fetchResumesFromDB(currentUserData.id);
    }

    // 2. Check URL for payment success
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("success") === "true";
    const sessionId = params.get("session_id"); // ✅ Now available from backend

    const updateCreditsInState = (newCredits: number) => {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
      if (!current?.id) return;

      const updated = { ...current, credits: newCredits };
      setUser(updated);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    };

    const runVerification = async () => {
       if (!currentUserData?.id || !BACKEND_URL) return;

       // A) FAST PATH: If we have a session_id, ask server to verify immediately
       if (sessionId) {
         try {
            console.log("Verifying payment session:", sessionId);
            const res = await fetch(`${BACKEND_URL}/api/credits/verify-session`, {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
                 "x-user-id": currentUserData.id
               },
               body: JSON.stringify({ sessionId })
            });
            
            const data = await res.json();
            if (data.success && typeof data.credits === 'number') {
               updateCreditsInState(data.credits);
               alert("Payment Successful! Your credits have been updated.");
               
               // Cleanup URL
               window.history.replaceState({}, "", window.location.pathname);
               return; // Done, no need to poll
            }
         } catch (e) {
            console.error("Verification failed, falling back to polling", e);
         }
       }

       // B) SLOW PATH (Fallback): Poll if no session_id or verify failed
       // (Only runs if A didn't return)
       const before = Number(currentUserData.credits || 0);
       let latest = before;

       for (let attempt = 0; attempt < 40; attempt++) {
          try {
             // force no-cache
             const res = await fetch(`${BACKEND_URL}/api/users/me?t=${Date.now()}`, {
               headers: { "x-user-id": currentUserData.id },
               cache: "no-store",
             });
             const data = await res.json();
             const credits = Number(data?.credits ?? data?.user?.credits);
             
             if (Number.isFinite(credits)) {
               latest = credits;
               if (latest > before) {
                 updateCreditsInState(latest);
                 alert("Payment Successful! Your credits have been updated.");
                 break;
               }
             }
          } catch (e) { console.warn("poll error", e); }
          
          await new Promise((r) => setTimeout(r, 500));
       }
       
       window.history.replaceState({}, "", window.location.pathname);
    };

    if (isSuccess && currentUserData) {
       runVerification();
    }

    // Window focus refresher (just in case)
    const onFocus = async () => {
       const current = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
       if (current?.id) {
         try {
            const res = await fetch(`${BACKEND_URL}/api/users/me?t=${Date.now()}`, {
               headers: { "x-user-id": current.id }
            });
            const data = await res.json();
            if (data.credits !== undefined) updateCreditsInState(data.credits);
         } catch(e) {}
       }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);

  }, []);

  useEffect(() => {
    let title = "OneClickCVPro | Instant AI Resume Builder";
    if (viewFromPath === "about") title = "About Us | OneClickCVPro";
    else if (viewFromPath === "blog") title = "Career Blog | OneClickCVPro";
    else if (viewFromPath === "pricing") title = "Pricing | OneClickCVPro";
    else if (viewFromPath === "contact") title = "Contact Support | OneClickCVPro";
    else if (viewFromPath === "dashboard") title = "My Dashboard | OneClickCVPro";
    else if (viewFromPath === "editor") title = "Resume Editor | OneClickCVPro";
    document.title = title;
  }, [viewFromPath, subPage]);

  const fetchResumesFromDB = async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/resumes`, {
        headers: { "x-user-id": userId },
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
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(resume),
      });
      fetchResumesFromDB(userId);
    } catch (e) {
      console.error("Failed to sync resume", e);
    }
  };

  const deleteResumeFromDB = async (resumeId: string, userId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/resumes/${resumeId}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
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

  const handleChatSendMessage = async (text: string) => {
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setIsChatLoading(true);
  
    const withTimeout = async <T,>(p: Promise<T>, ms = 45000): Promise<T> => {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("Chat request timed out. Please try again.")), ms)
        ),
      ]);
    };
  
    try {
      const currentResumeData = editorActionsRef.current?.getResume() || null;
      const history = ([
        ...chatMessages,
        { role: "user", text },
      ] as any[]).map((m) => ({ role: m.role as "user" | "model", text: m.text }));
  
      const result = await withTimeout(
        unifiedChatAgent(history, text, currentResumeData),
        45000
      );
  
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.text,
          proposal: result.proposal
            ? {
                data: result.proposal.data,
                description: result.proposal.description,
                status: "pending",
              }
            : undefined,
        },
      ]);
  
      if (result.proposal?.data) {
        editorActionsRef.current?.previewResume?.(result.proposal.data);
      }
    } catch (e: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: e?.message || "Service unavailable." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const spendCredit = async (reason: string) => {
    if (!user) throw Object.assign(new Error("Not logged in"), { status: 401 });

    const res = await fetch(`${BACKEND_URL}/api/credits/spend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = new Error(data?.error || "Credit spend failed");
      (err as any).status = res.status;
      throw err;
    }

    const updatedUser = { ...user, credits: data.credits };
    updateUserState(updatedUser);
    return data.credits;
  };

  const handleChatAcceptProposal = (index: number) => {
    const msg = chatMessages[index];
    if (msg.proposal && msg.proposal.status === "pending") {
      setChatMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[index].proposal!.status = "accepted";
        return newMsgs;
      });
      editorActionsRef.current?.updateResume(msg.proposal.data);
      editorActionsRef.current?.clearPreview?.();
    }
  };

  const handleChatDeclineProposal = (index: number) => {
    setChatMessages((prev) => {
      const newMsgs = [...prev];
      if (newMsgs[index].proposal) newMsgs[index].proposal!.status = "declined";
      return newMsgs;
    });
    editorActionsRef.current?.clearPreview?.();
  };

  const handleCreateNew = () => {
    setCurrentResume(null);
    navigate("/editor");
  };

  const handleOpenResume = (resume: SavedResume) => {
    setCurrentResume(resume);
    navigate("/editor");
  };

  const handleDeleteResume = (id: string) => {
    if (window.confirm("Delete this resume?")) {
      if (user) deleteResumeFromDB(id, user.id);
      else setSavedResumes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSaveResume = (resume: SavedResume) => {
    if (!user) {
      setPendingResumeSave(resume);
      setShowAuthModal(true);
      return;
    }

    syncResumeToDB(resume, user.id);

    setSavedResumes((prev) => {
      const idx = prev.findIndex((r) => r.id === resume.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = resume;
        return updated;
      }
      return [...prev, resume];
    });

    setCurrentResume(resume);
  };

  const handleCreditsPurchased = (newCredits: number) => {
    if (user) {
      const updatedUser = { ...user, credits: newCredits };
      updateUserState(updatedUser);
    }
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
        <Route
            path="/editor"
            element={
              <Editor
                key={`${editorSessionKey}-${user?.id ?? "guest"}`} 
                initialResume={currentResume}
                onSave={handleSaveResume}
                onBack={() => {
                  if (user) navigate("/dashboard");
                  else setShowAuthModal(true);
                }}
                isGuest={!user}
                onRequireAuth={() => setShowAuthModal(true)}
                currentUser={user}
                onAddCredits={() => setShowPricingModal(true)}
                onNavigate={handleNavigate}
                onRegisterActions={(actions) => (editorActionsRef.current = actions)}
                onSpendCredit={spendCredit}
              />
            }
          />

        <Route path="/dashboard" element={
          <RequireUser>
            <Dashboard
              user={user!}
              resumes={savedResumes}
              onCreate={handleCreateNew}
              onOpen={handleOpenResume}
              onDelete={handleDeleteResume}
              onLogout={handleLogout}
              onAddCredits={() => setShowPricingModal(true)}
              onNavigate={handleNavigate}
            />
          </RequireUser>
        } />

        <Route path="/about" element={<AboutPage onBack={() => navigate(user ? "/dashboard" : "/editor")} />} />
        <Route path="/contact" element={<ContactPage onBack={() => navigate(user ? "/dashboard" : "/editor")} />} />
        <Route path="/pricing" element={<PricingPage onBack={() => navigate(user ? "/dashboard" : "/editor")} onGetStarted={() => navigate("/editor")} />} />
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
      />

      {showAuthModal && (
        <AuthPage onLogin={handleLogin} isModal={true} onClose={() => setShowAuthModal(false)} />
      )}

      {showPricingModal && user && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          currentCredits={user.credits}
          onPurchase={handleCreditsPurchased}
          userId={user.id}
        />
      )}
    </>
  );
};

export default App;
