// STEP 3 — replace ENTIRE frontend/src/App.tsx with this version
// (This is your old code + routing. It keeps your functionality.)

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

  // NEW: proposal preview
  previewResume: (data: ResumeData) => void;
  clearPreview: () => void;
  isPreviewing: () => boolean;
}


// helpers: map “page view” to URL
const toPath = (page: PageView, sub?: any) => {
  switch (page) {
    case "dashboard":
      return "/dashboard";
    case "editor":
      return "/editor";
    case "about":
      return "/about";
    case "contact":
      return "/contact";
    case "pricing":
      return "/pricing";
    case "blog":
      // if you had subPage for blog post id:
      // return sub ? `/blog/${sub}` : "/blog";
      return "/blog";
    case "legal":
      // if you used subPage for legal type, encode it:
      return sub ? `/legal/${sub}` : "/legal";
    case "product":
      // if you used subPage for product type:
      return sub ? `/product/${sub}` : "/product";
    case "home":
    default:
      return "/";
  }
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // OLD STATE (kept)
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

  // Derive “view” from URL (instead of state)
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const viewFromPath: PageView =
    path === "/dashboard"
      ? "dashboard"
      : path === "/editor"
      ? "editor"
      : path === "/about"
      ? "about"
      : path === "/contact"
      ? "contact"
      : path === "/pricing"
      ? "pricing"
      : path.startsWith("/legal")
      ? "legal"
      : path.startsWith("/product")
      ? "product"
      : path === "/blog"
      ? "blog"
      : path === "/"
      ? "home"
      : "home";

  // load user + stripe success handler (kept from your old code)
  useEffect(() => {
    const log = (...args: any[]) => console.log("[stripe-success]", ...args);

    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchResumesFromDB(parsedUser.id);
    }

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("success") === "true";

    const fetchMe = async (userId: string) => {
      if (!BACKEND_URL) throw new Error("VITE_BACKEND_URL is empty in frontend build");

      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
        headers: { "x-user-id": userId },
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to fetch /api/users/me");

      const creditsRaw = data?.credits ?? data?.user?.credits ?? data?.data?.credits;
      const credits = Number(creditsRaw);

      return { data, credits };
    };

    const updateCreditsInState = (newCredits: number) => {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
      if (!current?.id) return;

      const updated = { ...current, credits: newCredits };
      setUser(updated);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    };

    if (isSuccess) {
      (async () => {
        try {
          const current = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
          log("success=true detected", { current, BACKEND_URL });

          if (!current?.id) {
            alert("Payment successful. Please log in again to refresh credits.");
            window.history.replaceState({}, "", window.location.pathname);
            return;
          }

          const before = Number(current.credits || 0);
          let latest = before;

          for (let attempt = 0; attempt < 30; attempt++) {
            try {
              const { credits, data } = await fetchMe(current.id);
              log("me response", { attempt, credits, data });

              if (Number.isFinite(credits)) {
                latest = credits;
                updateCreditsInState(latest);
                if (latest > before) break;
              }
            } catch (e: any) {
              log("poll error", e?.message || e);
            }
            await new Promise((r) => setTimeout(r, 1000));
          }

          window.history.replaceState({}, "", window.location.pathname);

          if (latest > before) alert(`Payment successful! Credits updated: ${before} → ${latest}`);
          else alert("Payment successful! Credits will appear shortly. (If not, reload once.)");
        } catch (e: any) {
          console.error("[stripe-success] fatal", e);
          alert(`Payment success handler failed: ${e?.message || e}`);
          window.history.replaceState({}, "", window.location.pathname);
        }
      })();
    }

    const onFocus = async () => {
      try {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
        if (!current?.id) return;
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
          headers: { "x-user-id": current.id },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        const creditsRaw = data?.credits ?? data?.user?.credits ?? data?.data?.credits;
        const credits = Number(creditsRaw);
        if (Number.isFinite(credits)) {
          const updated = { ...current, credits };
          setUser(updated);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn("[stripe-success] focus refresh failed", e);
      }
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // SEO title (kept, now driven by URL)
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
    navigate("/editor");
  };

  // IMPORTANT: old "handleNavigate" now changes URL
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
  
      // IMPORTANT: build history from latest state (avoid stale closure)
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
  
      // OPTIONAL: if a proposal arrives, auto-preview it (see section 2)
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
    }
  };

  const handleChatDeclineProposal = (index: number) => {
    setChatMessages((prev) => {
      const newMsgs = [...prev];
      if (newMsgs[index].proposal) newMsgs[index].proposal!.status = "declined";
      return newMsgs;
    });
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

  const handleAddCredits = () => {
    if (!user) return;
    setShowPricingModal(false);
  };

  // ROUTE GUARDS
  const RequireUser: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (user) return <>{children}</>;
    // open login modal and send to editor
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
        {/* special verify routes */}
        <Route path="/verified" element={<VerifiedPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* public pages */}
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={
          <Editor
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
        } />

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

        {/* dynamic-ish pages (simple) */}
        <Route path="/legal/:type" element={<LegalPage type={subPage as LegalPageType} onBack={() => navigate(user ? "/dashboard" : "/editor")} />} />
        <Route path="/product/:type" element={<ProductPage type={subPage as ProductType} onBack={() => navigate(user ? "/dashboard" : "/editor")} onStart={() => navigate("/editor")} />} />

        {/* fallback */}
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
          onPurchase={handleAddCredits}
          userId={user.id}
        />
      )}
    </>
  );
};

export default App;
