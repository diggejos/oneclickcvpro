import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";

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
import VerifiedPage from "./components/VerifiedPage";
import { TopNav } from "./components/TopNav";

import { unifiedChatAgent } from "./services/geminiService";
import type { User, SavedResume, LegalPageType, ProductType, ChatMessage, ResumeData } from "./types";

const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || "";
const STORAGE_KEY_USER = "oneclickcv_user";

export interface EditorActions {
  getResume: () => ResumeData | null;
  updateResume: (data: ResumeData) => void;
  isTailored: () => boolean;
}

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

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

  const updateUserState = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  };

  const fetchResumesFromDB = async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/resumes`, { headers: { "x-user-id": userId } });
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

  // Load user from localStorage on first mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchResumesFromDB(parsedUser.id);
    }
  }, []);

  // Stripe success handling (query param lives in router location)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") !== "true") return;

    (async () => {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
      if (!current?.id) {
        alert("Payment successful. Please log in again to refresh credits.");
        navigate(location.pathname, { replace: true });
        return;
      }

      // Try to refresh credits once (polling machen wir später sauber, erst routing fix)
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/me`, { headers: { "x-user-id": current.id } });
        const data = await res.json();

        if (res.ok && typeof data.credits === "number") {
          updateUserState({ ...current, credits: data.credits });
          alert(`Payment successful! Credits updated: ${current.credits} → ${data.credits}`);
        } else {
          alert("Payment successful! Credits will appear shortly.");
        }
      } catch {
        alert("Payment successful! Credits will appear shortly.");
      } finally {
        navigate(location.pathname, { replace: true });
      }
    })();
  }, [location.search, location.pathname, navigate]);

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
    navigate("/");
  };

  const handleSaveResume = (resume: SavedResume) => {
    if (!user) {
      setPendingResumeSave(resume);
      setShowAuthModal(true);
      return;
    }

    syncResumeToDB(resume, user.id);

    const existingIndex = savedResumes.findIndex((r) => r.id === resume.id);
    if (existingIndex >= 0) {
      const updated = [...savedResumes];
      updated[existingIndex] = resume;
      setSavedResumes(updated);
    } else {
      setSavedResumes([...savedResumes, resume]);
    }

    setCurrentResume(resume);
  };

  const handleChatSendMessage = async (text: string) => {
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setIsChatLoading(true);
    try {
      const currentResumeData = editorActionsRef.current?.getResume() || null;
      const history = chatMessages.map((m) => ({ role: m.role as "user" | "model", text: m.text }));
      const result = await unifiedChatAgent(history, text, currentResumeData);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: result.text,
          proposal: result.proposal
            ? { data: result.proposal.data, description: result.proposal.description, status: "pending" }
            : undefined,
        },
      ]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Service unavailable." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatAcceptProposal = (index: number) => {
    const msg = chatMessages[index];
    if (msg.proposal && msg.proposal.status === "pending") {
      setChatMessages((prev) => {
        const next = [...prev];
        next[index].proposal!.status = "accepted";
        return next;
      });
      editorActionsRef.current?.updateResume(msg.proposal.data);
    }
  };

  const handleChatDeclineProposal = (index: number) => {
    setChatMessages((prev) => {
      const next = [...prev];
      if (next[index].proposal) next[index].proposal!.status = "declined";
      return next;
    });
  };

  // ---- Route wrappers (lesen params sauber aus) ----
  const ProductRoute = () => {
    const { type } = useParams();
    return (
      <ProductPage
        type={(type as ProductType) || ("resume" as ProductType)}
        onBack={() => navigate(-1)}
        onStart={() => navigate("/")}
      />
    );
  };

  const LegalRoute = () => {
    const { type } = useParams();
    return <LegalPage type={(type as LegalPageType) || ("terms" as LegalPageType)} onBack={() => navigate(-1)} />;
  };

  const BlogRoute = () => {
    const { postId } = useParams();
    return <BlogPage onBack={() => navigate(-1)} initialPostId={postId || null} />;
  };

  return (
    <>
      {/* ✅ TopNav bleibt jetzt immer sichtbar auf ALLEN Seiten */}
      <TopNav
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenPricing={() => setShowPricingModal(true)}
      />

      <Routes>
        <Route
          path="/"
          element={
            <Editor
              initialResume={currentResume}
              onSave={handleSaveResume}
              onBack={() => navigate("/dashboard")}
              isGuest={!user}
              onRequireAuth={() => setShowAuthModal(true)}
              currentUser={user}
              onAddCredits={() => setShowPricingModal(true)}
              onNavigate={() => {}} // wird später gelöscht (wenn überall Links)
              onRegisterActions={(actions) => {
                editorActionsRef.current = actions;
              }}
              onSpendCredit={async () => {
                throw new Error("spendCredit wiring kommt im nächsten Schritt");
              }}
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard
                user={user}
                resumes={savedResumes}
                onCreate={() => {
                  setCurrentResume(null);
                  navigate("/");
                }}
                onOpen={(resume) => {
                  setCurrentResume(resume);
                  navigate("/");
                }}
                onDelete={(id) => deleteResumeFromDB(id, user.id)}
                onLogout={handleLogout}
                onAddCredits={() => setShowPricingModal(true)}
                onNavigate={() => {}}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="/product/:type" element={<ProductRoute />} />
        <Route path="/pricing" element={<PricingPage onBack={() => navigate(-1)} onGetStarted={() => navigate("/")} />} />
        <Route path="/blog" element={<BlogRoute />} />
        <Route path="/blog/:postId" element={<BlogRoute />} />
        <Route path="/about" element={<AboutPage onBack={() => navigate(-1)} />} />
        <Route path="/contact" element={<ContactPage onBack={() => navigate(-1)} />} />
        <Route path="/legal/:type" element={<LegalRoute />} />
        <Route path="/verified" element={<VerifiedPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <GlobalChatAssistant
        messages={chatMessages}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        isLoading={isChatLoading}
        onSendMessage={handleChatSendMessage}
        onAcceptProposal={handleChatAcceptProposal}
        onDeclineProposal={handleChatDeclineProposal}
        hasActiveResume={location.pathname === "/" && !!editorActionsRef.current}
      />

      {showAuthModal && <AuthPage onLogin={handleLogin} isModal={true} onClose={() => setShowAuthModal(false)} />}

      {showPricingModal && user && (
        <PricingModal
          onClose={() => setShowPricingModal(false)}
          currentCredits={user.credits}
          onPurchase={() => setShowPricingModal(false)}
          userId={user.id}
        />
      )}
    </>
  );
};

export default App;
