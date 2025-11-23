import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", iconOnly = false, light = false }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <rect x="0" y="0" width="100" height="100" rx="20" fill={light ? "#ffffff" : "#4F46E5"} />
          <path d="M30 30 L70 30 L70 80 L30 80 Z" fill={light ? "#4F46E5" : "white"} />
          <path d="M30 30 L50 50 L70 30" fill={light ? "#4F46E5" : "white"} opacity="0.2"/>
          {/* Sparkle */}
          <path d="M75 20 L80 10 L85 20 L95 25 L85 30 L80 40 L75 30 L65 25 Z" fill="#FBBF24" />
        </svg>
      </div>
      {!iconOnly && (
        <span className={`font-extrabold tracking-tight text-xl ${light ? 'text-white' : 'text-slate-900'}`}>
          ResuMate<span className={light ? 'text-indigo-200' : 'text-indigo-600'}>AI</span>
        </span>
      )}
    </div>
  );
};