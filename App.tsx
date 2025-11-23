import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { PricingModal } from './components/PricingModal';
import { User, SavedResume } from './types';

// Storage Helpers (Simulate Backend)
const STORAGE_KEY_USER = 'oneclickcv_user';
const STORAGE_KEY_DATA = 'oneclickcv_resumes';

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'dashboard' | 'editor'>('editor');
  const [user, setUser] = useState<User | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResume, setCurrentResume] = useState<SavedResume | null>(null);

  // Auth & Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pendingResumeSave, setPendingResumeSave] = useState<SavedResume | null>(null);

  // Restore session on load
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadResumes();
    }
  }, []);

  const loadResumes = () => {
    const data = localStorage.getItem(STORAGE_KEY_DATA);
    if (data) {
      setSavedResumes(JSON.parse(data));
    }
  };

  const updateUserState = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  };

  const handleLogin = (loggedInUser: User) => {
    // Ensure user has credits field (migration for old users)
    const userWithCredits = { ...loggedInUser, credits: loggedInUser.credits ?? 5 };
    updateUserState(userWithCredits);
    
    loadResumes();
    setShowAuthModal(false);

    if (pendingResumeSave) {
      handleSaveResume(pendingResumeSave);
      setPendingResumeSave(null);
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    setView('editor');
    setCurrentResume(null);
  };

  // --- RESUME ACTIONS ---

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
      const updated = savedResumes.filter(r => r.id !== id);
      setSavedResumes(updated);
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updated));
    }
  };

  const handleSaveResume = (resume: SavedResume) => {
    if (!user) {
      setPendingResumeSave(resume);
      setShowAuthModal(true);
      return;
    }

    const existingIndex = savedResumes.findIndex(r => r.id === resume.id);
    let updatedResumes;
    
    if (existingIndex >= 0) {
      updatedResumes = [...savedResumes];
      updatedResumes[existingIndex] = resume;
    } else {
      updatedResumes = [...savedResumes, resume];
    }
    
    setSavedResumes(updatedResumes);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedResumes));
    setCurrentResume(resume); 
  };

  // --- CREDIT ACTIONS ---

  const handleAddCredits = (amount: number) => {
    if (!user) return;
    const updatedUser = { ...user, credits: (user.credits || 0) + amount };
    updateUserState(updatedUser);
    setShowPricingModal(false);
    alert(`Successfully added ${amount} credits!`);
  };
  
  const handleConsumeCredit = () => {
    if (user && user.credits > 0) {
       updateUserState({ ...user, credits: user.credits - 1 });
    }
  };

  return (
    <>
      {/* Main View Routing */}
      {view === 'dashboard' && user ? (
        <Dashboard 
          user={user} 
          resumes={savedResumes} 
          onCreate={handleCreateNew} 
          onOpen={handleOpenResume} 
          onDelete={handleDeleteResume}
          onLogout={handleLogout}
          onAddCredits={() => setShowPricingModal(true)}
        />
      ) : (
        <Editor 
          initialResume={currentResume} 
          onSave={handleSaveResume} 
          onBack={() => {
            if (user) {
              loadResumes();
              setView('dashboard');
            } else {
              setShowAuthModal(true);
            }
          }} 
          isGuest={!user}
          onRequireAuth={() => setShowAuthModal(true)}
          currentUser={user}
          onAddCredits={() => setShowPricingModal(true)}
        />
      )}

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthPage 
          onLogin={handleLogin} 
          isModal={true} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}

      {/* Pricing Modal Overlay */}
      {showPricingModal && user && (
        <PricingModal 
          onClose={() => setShowPricingModal(false)}
          currentCredits={user.credits}
          onPurchase={handleAddCredits}
        />
      )}
    </>
  );
};

export default App;