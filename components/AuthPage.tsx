import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';

// --- GOOGLE LOGIN CONFIGURATION ---
// 1. Go to console.cloud.google.com -> API & Services -> Credentials
// 2. Create an OAuth Client ID (Web Application)
// 3. Add your authorized origin (e.g., http://localhost:5173 or https://your-domain.com)
// 4. Paste the Client ID string below
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""; 

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
        google.accounts.id.renderButton(
          document.getElementById("googleButton"),
          { theme: "outline", size: "large", width: "100%" } 
        );
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

  const handleSimulatedGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'user-google-demo',
        email: 'demo@gmail.com',
        name: 'Demo User',
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        credits: 3
      });
    }, 1000);
  };

  const containerClasses = isModal 
    ? "fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in"
    : "min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4";

  const cardClasses = isModal
    ? "bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 w-full max-w-md relative"
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
            {isModal ? 'Create an account to save your resume and unlock premium tailoring.' : 'The intelligent resume tailoring platform.'}
          </p>
        </div>

        <div className="space-y-4">
            {/* REAL GOOGLE BUTTON CONTAINER */}
            {GOOGLE_CLIENT_ID && !googleError && (
               <div className="w-full h-[42px] flex justify-center">
                 <div id="googleButton" className="w-full"></div>
               </div>
            )}

            {/* FALLBACK SIMULATED BUTTON (If no Client ID) */}
            {(!GOOGLE_CLIENT_ID || googleError) && (
              <div className="space-y-2">
                <button 
                  onClick={handleSimulatedGoogleLogin}
                  className="w-full py-2.5 px-4 border border-slate-300 rounded-lg flex items-center justify-center gap-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google (Demo)
                </button>
                {!GOOGLE_CLIENT_ID && (
                   <div className="text-[10px] text-center text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded flex items-center justify-center gap-2">
                     <AlertTriangle size={12} /> 
                     <span>Set <code>GOOGLE_CLIENT_ID</code> in code for real login.</span>
                   </div>
                )}
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
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    {isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
        </div>

        {/* Footer Toggle */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="font-bold text-indigo-600 hover:text-indigo-800"
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {!isModal && (
          <div className="mt-12 grid grid-cols-2 gap-4 text-xs text-slate-400 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" /> Free Tier Available
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" /> No Credit Card Required
            </div>
          </div>
        )}
      </div>
    </div>
  );
};