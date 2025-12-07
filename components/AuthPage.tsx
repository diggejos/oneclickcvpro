import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, X, AlertTriangle, Copy } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';

// BACKEND URL
// If VITE_BACKEND_URL is set (Production), use it. 
// Otherwise default to "" to let Vite Proxy handle routing to localhost:4242
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || "";
const GOOGLE_CLIENT_ID = "1040938691698-o9k428s47iskgq1vs6rk1dnc1857tnir.apps.googleusercontent.com";

declare const google: any;

interface AuthPageProps {
  onLogin: (user: User) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, isModal = false, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleError, setGoogleError] = useState(false);

  // --- GOOGLE LOGIN ---
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const handleCredentialResponse = async (response: any) => {
      try {
        setIsLoading(true);
        // Send token to backend for verification and user retrieval
        const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ token: response.credential })
        });

        if (!res.ok) throw new Error("Auth failed");

        const userData = await res.json();
        
        // Construct User object from Backend Response
        const user: User = {
          id: userData.id, // Using Mongo ID
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          credits: userData.credits // Real credits from DB
        };

        onLogin(user);
      } catch (e) {
        console.error("Backend Auth Error", e);
        alert("Authentication failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof google !== 'undefined') {
      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse
        });
        
        const btnContainer = document.getElementById("googleButton");
        if (btnContainer) {
          google.accounts.id.renderButton(
            btnContainer,
            { theme: "outline", size: "large", width: "100%" } 
          );
        }
      } catch (e) {
        setGoogleError(true);
      }
    } else {
      setGoogleError(true);
    }
  }, [onLogin]);

  // --- SIMULATED FALLBACK LOGIN (For when backend isn't running locally) ---
  const handleSimulatedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'user-' + crypto.randomUUID().substring(0,8),
        email: email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=4f46e5&color=fff`,
        credits: 3 // Default
      });
      setIsLoading(false);
    }, 1000);
  };

  const containerClasses = isModal 
    ? "fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in"
    : "min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4";

  const cardClasses = isModal
    ? "bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto"
    : "bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-md";

  return (
    <div className={containerClasses}>
      {isModal && onClose && (
        <div className="absolute inset-0" onClick={onClose}></div>
      )}
      
      <div className={cardClasses} onClick={e => e.stopPropagation()}>
        {isModal && onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <Logo className="mb-4 scale-125" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">
            {isModal ? 'Save & Continue' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 text-center">
            {isModal ? 'Log in to save your resume to the cloud.' : 'OneClickCVPro: Cloud-synced AI Resume Builder.'}
          </p>
        </div>

        <div className="space-y-4">
            <div className="w-full h-[42px] flex justify-center">
               <div id="googleButton" className="w-full"></div>
            </div>
            
            {googleError && (
               <div className="text-[10px] text-center text-red-600 bg-red-50 border border-red-100 p-2 rounded">
                 Google Sign-In failed to load.
               </div>
            )}

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-medium uppercase">Or continue with email</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSimulatedLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegister ? 'Create Account' : 'Sign In')}
                {!isLoading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="text-center mt-4">
              <button onClick={() => setIsRegister(!isRegister)} className="text-xs text-indigo-600 font-bold hover:underline">
                {isRegister ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
            
             <div className="mt-4 p-2 bg-slate-50 text-[10px] text-slate-400 text-center rounded">
                Note: Email login is simulated. Use Google for DB persistence.
             </div>
        </div>
      </div>
    </div>
  );
};