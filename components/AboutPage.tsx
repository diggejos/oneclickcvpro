
import React from 'react';
import { ArrowLeft, Users, Target, Heart } from 'lucide-react';
import { Logo } from './Logo';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
            <ArrowLeft size={20} /> Back to App
          </button>
          <Logo />
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            We Help You Get <span className="text-indigo-600">Hired</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            OneClickCVPro was born from a simple frustration: writing resumes is hard, tailored resumes are harder, and Applicant Tracking Systems (ATS) are confusing. We fixed that.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
            <p className="text-slate-600">To democratize access to career tools that were previously only available to executives with professional writers.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
             <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Who We Are</h3>
            <p className="text-slate-600">A team of HR experts, AI engineers, and designers obsessed with clean typography and effective communication.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
             <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Our Promise</h3>
            <p className="text-slate-600">Your data is yours. We prioritize privacy, security, and transparency in everything we build.</p>
          </div>
        </div>

        <div className="bg-indigo-900 text-white rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to upgrade your career?</h2>
          <button onClick={onBack} className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg">
            Build My CV Now
          </button>
        </div>
      </main>
    </div>
  );
};
