import React from "react";
import { Plus, LogOut, Zap, LogIn, ArrowLeft } from "lucide-react";
import { User, PageView } from "../types";
import { Logo } from "./Logo";

type Props = {
  user: User | null;
  onAddCredits: () => void;
  onLogout: () => void;
  onLogin: () => void;

  view?: PageView;
  onNavigate?: (page: PageView, subPage?: any) => void;
  onBack?: () => void; // optional: back button in navbar
};

export const TopNav: React.FC<Props> = ({
  user,
  onAddCredits,
  onLogout,
  onLogin,
  onNavigate,
  onBack,
}) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Full width: kein max-w Container */}
      <div className="w-full flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <button
            className="flex items-center"
            onClick={() => onNavigate?.(user ? "dashboard" : "editor")}
            title="Home"
          >
            <Logo />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <button
                onClick={onAddCredits}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full transition-colors border border-indigo-200 group"
              >
                <Zap size={14} className="fill-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">{user.credits} Credits</span>
                <Plus size={12} className="ml-1" />
              </button>

              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              <LogIn size={16} /> Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
