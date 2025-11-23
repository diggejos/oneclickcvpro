import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, X, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAcceptProposal: (index: number) => void;
  onDeclineProposal: (index: number) => void;
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  messages, 
  onSendMessage, 
  onAcceptProposal,
  onDeclineProposal,
  isLoading, 
  isOpen, 
  setIsOpen 
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

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center gap-2 px-4 py-3 z-[9999] transition-transform hover:scale-105 print:hidden animate-bounce-in"
        title="AI Assistant"
        style={{ animation: 'fade-in-up 0.5s ease-out' }}
      >
        <Bot size={24} />
        <span className="font-bold text-sm">AI Chat</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 print:hidden h-[550px]">
      {/* Header */}
      <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2 font-bold">
          <Bot size={20} />
          <span>Resume Assistant</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">
            <Sparkles className="mx-auto mb-2 text-indigo-300" size={32} />
            <p>Ask me to change anything!</p>
            <p className="text-xs mt-2 opacity-75">"Make the summary more punchy"</p>
            <p className="text-xs mt-1 opacity-75">"Add a skill called 'React Native'"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              {msg.text}

              {/* Proposal Card */}
              {msg.proposal && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Proposal</p>
                    <p className="text-slate-700 italic">"{msg.proposal.description}"</p>
                  </div>
                  
                  {msg.proposal.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onAcceptProposal(idx)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button 
                        onClick={() => onDeclineProposal(idx)}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  ) : msg.proposal.status === 'accepted' ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2 rounded border border-emerald-100">
                      <ThumbsUp size={14} /> Proposal Accepted
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
             <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          className="flex-grow bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          placeholder="Type a command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button 
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} className={isLoading ? "opacity-50" : ""} />
        </button>
      </form>
    </div>
  );
};