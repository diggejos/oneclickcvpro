import React from "react";
import { Plus, LogOut, Zap, LogIn, ArrowLeft } from "lucide-react";
import { User, PageView } from "../types";
import { Logo } from "./Logo";

type Props = {
  user: User | null;
  // ✅ NEW: Explicit credits prop ensures updates trigger immediately
  credits?: number; 
  
  onAddCredits: () => void;
  onLogout: () => void;
  onLogin: () => void;

  view?: PageView;
  onNavigate?: (page: PageView, subPage?: any) => void;
  onBack?: () => void;
};

export const TopNav: React.FC<Props> = ({
  user,
  credits, // Receive the explicit prop
  onAddCredits,
  onLogout,
  onLogin,
  onNavigate,
  onBack,
}) => {
  // Use explicit credits if available, otherwise fall back to user object
  const displayCredits = credits !== undefined ? credits : user?.credits;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="w-full flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
            className="flex items-center min-w-0"
            onClick={() => onNavigate?.(user ? "dashboard" : "editor")}
            title="Home"
          >
            {/* icon-only on mobile, full logo on desktop */}
            <span className="sm:hidden">
              <Logo iconOnly className="w-7 h-7" />
            </span>
            <span className="hidden sm:block">
              <Logo />
            </span>
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {user ? (
            <>
              {/* Credits (compact on mobile) */}
              <button
                onClick={onAddCredits}
                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 sm:px-3 py-1.5 rounded-full transition-colors border border-indigo-200 group"
                title="Add credits"
              >
                <Zap
                  size={14}
                  className="fill-indigo-500 group-hover:scale-110 transition-transform"
                />

                {/* always show number */}
                {/* ✅ UPDATED: Key forces re-render animation when number changes */}
                <span 
                  key={displayCredits} 
                  className="text-xs sm:text-sm font-bold tabular-nums animate-in fade-in zoom-in duration-300"
                >
                  {displayCredits}
                </span>

                {/* only show label on >= sm */}
                <span className="hidden sm:inline text-sm font-bold">Credits</span>

                {/* plus icon only really needed on desktop */}
                <span className="hidden sm:inline">
                  <Plus size={12} className="ml-1" />
                </span>
              </button>

              {/* Avatar + details (details hidden on mobile) */}
              <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-4">
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

              {/* Logout */}
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
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-sm"
            >
              <LogIn size={16} /> <span className="hidden sm:inline">Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
