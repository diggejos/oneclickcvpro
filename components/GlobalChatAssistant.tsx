import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, X, Check, ThumbsUp, ThumbsDown, MessageSquare, Lock, LogIn, Zap } from 'lucide-react';
import { ChatMessage } from '../types';

interface GlobalChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAcceptProposal: (index: number) => void;
  onDeclineProposal: (index: number) => void;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  hasActiveResume: boolean;
  
  // ✅ NEW: Auth & Credit Props
  isGuest: boolean;
  userCredits: number;
  onLogin: () => void;
  onAddCredits: () => void;
}

export const GlobalChatAssistant: React.FC<GlobalChatAssistantProps> = ({ 
  messages, 
  onSendMessage, 
  onAcceptProposal,
  onDeclineProposal,
  isLoading, 
  isOpen, 
  setIsOpen,
  hasActiveResume,
  isGuest,
  userCredits,
  onLogin,
  onAddCredits
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  // ✅ Determine access state
  const hasAccess = !isGuest && userCredits > 0;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center gap-2 px-5 py-4 z-[9999] transition-all hover:scale-105 print:hidden animate-in zoom-in duration-300 group"
        title="AI Assistant"
      >
        <div className="relative">
          {hasAccess ? <Bot size={28} /> : <Lock size={24} />}
          {hasAccess && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </div>
        <div className="text-left leading-tight hidden group-hover:block transition-all animate-in slide-in-from-right-2">
           <span className="block font-bold text-sm">AI Companion</span>
           <span className="block text-[10px] text-indigo-200">
             {hasAccess ? 'Support & Editing' : 'Premium Feature'}
           </span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 print:hidden h-[600px] max-h-[80vh]">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold">AI Companion</h3>
            <p className="text-xs text-indigo-200 flex items-center gap-1">
               {isGuest ? (
                 <><span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span> Guest Mode</>
               ) : userCredits === 0 ? (
                 <><span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span> No Credits</>
               ) : hasActiveResume ? (
                 <><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Resume Connected</>
               ) : (
                 <><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span> Support Mode</>
               )}
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* ✅ CONDITIONAL CONTENT */}
      {hasAccess ? (
        // --- 1. CHAT INTERFACE (Allowed) ---
        <>
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10 px-4">
                <Sparkles className="mx-auto mb-4 text-indigo-300" size={40} />
                <h4 className="font-bold text-slate-600 mb-2">How can I help?</h4>
                
                <div className="space-y-2">
                   {hasActiveResume ? (
                      <>
                        <p className="bg-white p-2 rounded border border-slate-200 text-xs cursor-pointer hover:border-indigo-300 hover:text-indigo-600" onClick={() => setInput("Rewrite my summary to be punchy")}>"Rewrite my summary to be punchy"</p>
                        <p className="bg-white p-2 rounded border border-slate-200 text-xs cursor-pointer hover:border-indigo-300 hover:text-indigo-600" onClick={() => setInput("Add Python to my skills")}>"Add Python to my skills"</p>
                      </>
                   ) : (
                      <>
                        <p className="bg-white p-2 rounded border border-slate-200 text-xs cursor-pointer hover:border-indigo-300 hover:text-indigo-600" onClick={() => setInput("How much does Pro cost?")}>"How much does Pro cost?"</p>
                        <p className="bg-white p-2 rounded border border-slate-200 text-xs cursor-pointer hover:border-indigo-300 hover:text-indigo-600" onClick={() => setInput("How do I import from LinkedIn?")}>"How do I import from LinkedIn?"</p>
                      </>
                   )}
                </div>
                {!hasActiveResume && (
                  <p className="text-[10px] mt-4 opacity-75">
                     Tip: Open the Editor to ask me to make changes to your CV!
                  </p>
                )}
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.role === 'assistant' && (
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2 mt-1 flex-shrink-0">
                      <Bot size={16} />
                   </div>
                 )}
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}

                  {/* Proposal Card */}
                  {msg.proposal && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-3">
                        <p className="text-xs font-bold text-indigo-600 uppercase mb-1 flex items-center gap-1"><Sparkles size={12}/> Edit Proposal</p>
                        <p className="text-slate-700 italic">"{msg.proposal.description}"</p>
                      </div>
                      
                      {msg.proposal.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onAcceptProposal(idx)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button 
                            onClick={() => onDeclineProposal(idx)}
                            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <X size={14} /> Decline
                          </button>
                        </div>
                      ) : msg.proposal.status === 'accepted' ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2 rounded border border-emerald-100">
                          <ThumbsUp size={14} /> Change Applied
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-slate-100 p-2 rounded border border-slate-200">
                          <ThumbsDown size={14} /> Proposal Declined
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-2 mt-1">
                    <Bot size={16} />
                 </div>
                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center h-10">
                   <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                 </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              className="flex-grow bg-slate-100 border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              placeholder={hasActiveResume ? "Ask support or edit CV..." : "Ask me anything..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <Send size={18} className={isLoading ? "opacity-50" : ""} />
            </button>
          </form>
        </>
      ) : (
        // --- 2. GATEKEEPER (Locked) ---
        <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200">
              <Lock size={32} className="text-slate-400" />
           </div>
           
           <h3 className="text-lg font-bold text-slate-800 mb-2">
             AI Companion Locked
           </h3>
           
           <p className="text-sm text-slate-500 mb-6 leading-relaxed">
             {isGuest 
               ? "Sign in to access your personal AI assistant. It can edit your resume, answer career questions, and more."
               : "You need at least 1 credit in your account to activate the AI Companion. (Using the chat itself is free!)"
             }
           </p>

           {isGuest ? (
             <button 
               onClick={onLogin}
               className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"
             >
               <LogIn size={18} /> Login to Chat
             </button>
           ) : (
             <button 
               onClick={onAddCredits}
               className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"
             >
               <Zap size={18} className="fill-yellow-400 text-yellow-400" /> Add Credits
             </button>
           )}
        </div>
      )}
    </div>
  );
};
