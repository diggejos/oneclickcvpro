
import React from 'react';
import { ArrowLeft, Check, Zap, HelpCircle, Star } from 'lucide-react';
import { Logo } from './Logo';

interface PricingPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
           <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
             <ArrowLeft size={20} /> Back to App
           </button>
           <Logo />
           <div className="w-20"></div> {/* Spacer */}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-indigo-900 text-white py-20 px-6 text-center overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 L100 0 L100 100 Z" fill="white" />
            </svg>
         </div>
         
         <div className="relative z-10 max-w-3xl mx-auto">
           <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
             Invest in your career, <br/>
             <span className="text-indigo-300">not a subscription.</span>
           </h1>
           <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
             Our flexible Credit System means you only pay for what you use. 
             Create unlimited base resumes for free. Pay only when you use AI to tailor or translate.
           </p>
         </div>
      </header>

      {/* Pricing Cards */}
      <main className="max-w-6xl mx-auto px-6 py-16 -mt-16 relative z-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Tier */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col">
               <div className="mb-4">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">The Basics</span>
               </div>
               <h3 className="text-3xl font-bold text-slate-900 mb-2">Free</h3>
               <p className="text-slate-500 mb-6 text-sm">Perfect for building your base CV structure.</p>
               
               <div className="flex-grow space-y-4 mb-8">
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>Unlimited Base Resume Parsing</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>LinkedIn PDF Import</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>Access to Classic Template</span>
                  </div>
                   <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>PDF Export</span>
                  </div>
               </div>
               
               <button onClick={onGetStarted} className="w-full py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-400 hover:text-slate-900 transition-colors">
                  Start for Free
               </button>
            </div>

            {/* Starter Pack */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-8 flex flex-col relative overflow-hidden">
               <div className="mb-4">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Starter Pack</span>
               </div>
               <div className="flex items-baseline gap-1 mb-2">
                 <h3 className="text-4xl font-bold text-slate-900">$5</h3>
                 <span className="text-slate-500 text-sm">/ once</span>
               </div>
               <p className="text-slate-500 mb-6 text-sm">For tailored applications to your top picks.</p>
               
               <div className="flex-grow space-y-4 mb-8">
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Zap size={18} className="text-indigo-600 flex-shrink-0 fill-indigo-100" />
                    <span className="font-bold">10 AI Credits</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>AI Job Description Tailoring</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>Multi-Language Translation</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>All Pro Templates</span>
                  </div>
               </div>
               
               <button onClick={onGetStarted} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Get Started
               </button>
            </div>

            {/* Pro Pack */}
            <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col text-white relative">
               <div className="absolute top-0 right-0 p-4">
                  <Star className="text-yellow-400 fill-yellow-400" size={24} />
               </div>
               <div className="mb-4">
                  <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Pro Value</span>
               </div>
               <div className="flex items-baseline gap-1 mb-2">
                 <h3 className="text-4xl font-bold text-white">$19</h3>
                 <span className="text-slate-400 text-sm">/ once</span>
               </div>
               <p className="text-slate-300 mb-6 text-sm">Massive volume for serious job hunters.</p>
               
               <div className="flex-grow space-y-4 mb-8">
                  <div className="flex gap-3 text-sm text-slate-200">
                    <Zap size={18} className="text-yellow-400 flex-shrink-0 fill-yellow-400" />
                    <span className="font-bold text-white">50 AI Credits</span>
                  </div>
                   <div className="flex gap-3 text-sm text-slate-200">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <span>Advanced GPT-4 Rewrite Mode</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-200">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <span>Priority Support</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-200">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <span>Lifetime Access to Resume</span>
                  </div>
               </div>
               
               <button onClick={onGetStarted} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                  Get Pro Pack
               </button>
            </div>
         </div>

         {/* FAQ Section */}
         <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-600"/> How do credits work?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                     One credit allows you to perform one major AI operation. For example, tailoring your resume to a specific job description costs 1 credit. Translating your resume to another language costs 1 credit. Editing manually is always free.
                  </p>
               </div>
               
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-600"/> Do credits expire?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                     No. Once you purchase a credit pack, the credits are yours forever until you use them. There is no monthly subscription fee.
                  </p>
               </div>

               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-600"/> Can I download my resume for free?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                     Yes! Generating the base resume from your LinkedIn profile and downloading the PDF is completely free. You only pay for the AI tailoring features.
                  </p>
               </div>
            </div>
         </div>

         <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Ready to get hired faster?</h2>
            <button onClick={onGetStarted} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-full text-lg shadow-xl hover:bg-indigo-700 transition-transform hover:scale-105">
               Build My Resume Now
            </button>
         </div>

      </main>
    </div>
  );
};
