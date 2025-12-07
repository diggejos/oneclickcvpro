
import React from 'react';
import { LegalPageType } from '../types';
import { LEGAL_CONTENT } from '../data/content';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  type: LegalPageType;
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack }) => {
  const content = LEGAL_CONTENT[type];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-12 px-6">
      <div className="max-w-3xl w-full">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </button>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-200">
          {content.title}
        </h1>
        
        <div 
          className="prose prose-slate max-w-none text-slate-700"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      </div>
    </div>
  );
};
