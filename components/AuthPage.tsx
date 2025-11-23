import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, X, AlertTriangle, Copy } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';

// --- GOOGLE LOGIN CONFIGURATION ---
// In a production environment, this should be in a .env file (e.g. process.env.GOOGLE_CLIENT_ID)
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
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // --- REAL GOOGLE LOGIN LOGIC ---
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const handleCredentialResponse = (response: any) => {
      try {
        // Decode JWT ID Token
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);

        // Construct User object from real Google data
        const user: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          avatar: payload.picture,
          credits: 5 // Grant new users 5 free credits
        };

        onLogin(user);
      } catch (e) {
        console.error("Failed to parse Google ID token", e);
      }
    };

    if (typeof google !== 'undefined') {
      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse
        });
        
        // Render the button into the div with id="googleButton"
        const btnContainer = document.getElementById("googleButton");
        if (btnContainer) {
          google.accounts.id.renderButton(
            btnContainer,
            { theme: "outline", size: "large", width: "100%" } 
          );
        }
      } catch (e) {
        console.error("Google GSI loaded but failed to initialize", e);
        setGoogleError(true);
      }
    } else {
      setGoogleError(true);
    }
  }, []);

  // --- SIMULATED FALLBACK LOGIN ---
  const handleSimulatedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      onLogin({
        id: 'user-' + crypto.randomUUID().substring(0,8),
        email: email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=4f46e5&color=fff`,
        credits: 3 // Default simulated credits
      });
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

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Logo className="mb-4 scale-125" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">
            {isModal ? 'Save & Continue' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 text-center">
            {isModal ? 'Create an account to save your resume and unlock premium tailoring.' : 'OneClickCVPro: The intelligent resume tailoring platform.'}
          </p>
        </div>

        <div className="space-y-4">
            {/* REAL GOOGLE BUTTON CONTAINER */}
            <div className="w-full h-[42px] flex justify-center">
               <div id="googleButton" className="w-full"></div>
            </div>
            
            {/* Fallback error message if Google script fails or origin mismatch */}
            {googleError && (
               <div className="text-[10px] text-center text-red-600 bg-red-50 border border-red-100 p-2 rounded">
                 Google Sign-In failed to load. Check console for details.
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
            
            {/* GOOGLE CONFIG HELPER - FOR DEMO ONLY */}
            <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500 text-center break-all">
               <p className="font-bold mb-1 flex items-center justify-center gap-1"><AlertTriangle size={10} className="text-amber-500"/> Google Login Setup</p>
               <p className="mb-2">Add this URL to <strong>Authorized JavaScript origins</strong> in Google Console:</p>
               <code className="bg-white border border-slate-300 px-2 py-1 rounded select-all block mb-2">{currentOrigin}</code>
               <button onClick={() => navigator.clipboard.writeText(currentOrigin)} className="text-indigo-600 hover:underline flex items-center justify-center gap-1 w-full">
                  <Copy size={10} /> Copy URL
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};