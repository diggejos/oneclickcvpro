import React, { useState } from 'react';
import type { User } from '../types';

// Same pattern as in App.tsx
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || '';

interface AuthPageProps {
  onLogin: (user: User) => void;
  isModal?: boolean;
  onClose?: () => void;
}

type Mode = 'login' | 'signup';

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, isModal, onClose }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email || !password || (mode === 'signup' && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        // 1) EMAIL SIGN UP: hits /api/auth/register on backend
        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        // We assume backend sends confirmation email.
        setInfo(
          'Check your inbox and confirm your email. Once confirmed, you can log in here.'
        );
        setMode('login');
      } else {
        // 2) EMAIL LOGIN: hits /api/auth/login
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // data must match your User interface
        onLogin({
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          credits: data.credits,
        });

        if (onClose) onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3) GOOGLE LOGIN: calls /api/auth/google with the Google ID token
  const handleGoogleLogin = async () => {
    resetMessages();

    // You probably already have GIS wired somewhere – this is the minimal pattern.
    // If you already call google.accounts.id.prompt() elsewhere, you can keep that
    // and just reuse the token→backend part below.
    // @ts-ignore
    const google = window.google;
    if (!google || !google.accounts || !google.accounts.id) {
      setError('Google login is not available right now.');
      return;
    }

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError('Google login was cancelled or failed.');
      }
    });

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      callback: async (credentialResponse: any) => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: credentialResponse.credential }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Google login failed');

          onLogin({
            id: data.id,
            email: data.email,
            name: data.name,
            avatar: data.avatar,
            credits: data.credits,
          });

          if (onClose) onClose();
        } catch (err: any) {
          setError(err.message || 'Google login failed');
        }
      },
    });

    // Optionally render a one-tap or popup – here we just trigger it
    google.accounts.id.prompt();
  };

  const title = mode === 'signup' ? 'Create your account' : 'Welcome back';
  const subtitle =
    mode === 'signup'
      ? 'Use email or Google to get started'
      : 'Log in to access your saved CVs and credits';

  const containerClasses =
    'w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8';

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'
          : 'min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12'
      }
    >
      <div className={containerClasses}>
        {/* Header + Close */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="mt-6 flex rounded-full bg-slate-100 p-1 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setMode('login');
            }}
            className={
              'flex-1 rounded-full py-1.5 sm:py-2 text-center transition ' +
              (mode === 'login'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-500')
            }
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setMode('signup');
            }}
            className={
              'flex-1 rounded-full py-1.5 sm:py-2 text-center transition ' +
              (mode === 'signup'
                ? 'bg-white shadow text-slate-900'
                : 'text-slate-500')
            }
          >
            Sign up
          </button>
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="h-5 w-5"
          />
          <span>
            {mode === 'signup'
              ? 'Continue with Google'
              : 'Log in with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">
            or with email
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="••••••••"
            />
            {mode === 'signup' && (
              <p className="mt-1 text-[11px] text-slate-400">
                At least 8 characters recommended.
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting
              ? 'Please wait…'
              : mode === 'signup'
              ? 'Sign up with email'
              : 'Log in with email'}
          </button>
        </form>

        {mode === 'login' && (
          <p className="mt-4 text-[11px] text-slate-400">
            New here?{' '}
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setMode('signup');
              }}
              className="font-medium text-slate-700 underline"
            >
              Create an account
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
