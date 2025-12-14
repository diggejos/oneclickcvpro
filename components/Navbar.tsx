import React from "react";
import { PageView, User } from "../types";

type Props = {
  user: User | null;
  credits?: number;
  onNavigate: (page: PageView, subPage?: any) => void;
  onAddCredits: () => void;
  onLogin: () => void;
  onLogout: () => void;
};

export const Navbar: React.FC<Props> = ({ user, credits, onNavigate, onAddCredits, onLogin, onLogout }) => {
  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate(user ? "dashboard" : "editor")}
          className="flex items-center gap-2 font-bold text-slate-800"
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">■</span>
          OneClickCVPro
        </button>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={onAddCredits}
                className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full"
              >
                ⚡ {credits ?? 0} Credits +
              </button>

              <button
                onClick={() => onNavigate("dashboard")}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </button>

              <button
                onClick={onLogout}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("pricing")}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Pricing
              </button>
              <button
                onClick={onLogin}
                className="text-sm font-bold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
