import React from 'react';
import { ArrowLeft, Check, Zap, HelpCircle, Star, TrendingUp } from 'lucide-react';
import { Logo } from './Logo';

interface PricingPageProps {
  onBack: () => void;
  onGetStarted: () => void;
  onBuy: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onGetStarted, onBuy }) => {
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
             Same powerful AI features for everyone—just choose your volume.
           </p>
         </div>
      </header>

      {/* Pricing Cards */}
      <main className="max-w-6xl mx-auto px-6 py-16 -mt-16 relative z-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Tier */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col">
               <div className="mb-6">
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
                  <div className="flex gap-3 text-sm text-slate-400">
                    <Zap size={18} className="text-slate-300 flex-shrink-0" />
                    <span>Pay only for AI & Export</span>
                  </div>
               </div>
               
               <button onClick={onGetStarted} className="w-full py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-400 hover:text-slate-900 transition-colors">
                  Start Building
               </button>
            </div>

            {/* Starter Pack */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-8 flex flex-col relative overflow-hidden">
               <div className="mb-6 flex justify-between items-start">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Starter Pack</span>
               </div>
               
               <div className="flex items-baseline gap-1 mb-1">
                 <h3 className="text-4xl font-bold text-slate-900">$5</h3>
                 <span className="text-slate-500 text-sm">/ once</span>
               </div>
               <p className="text-indigo-600 text-xs font-bold mb-2">$0.50 per credit</p>
               <p className="text-slate-500 mb-6 text-sm">For tailored applications to your top picks.</p>
               
               <div className="flex-grow space-y-4 mb-8">
                  <div className="flex gap-3 text-sm text-slate-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <Zap size={18} className="text-indigo-600 flex-shrink-0 fill-indigo-100" />
                    <span className="font-bold text-indigo-900">10 AI Credits</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>AI Job Description Tailoring</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>PDF Export & Downloads</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                    <span>Access All Features</span>
                  </div>
               </div>
               
               <button onClick={onBuy} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Get Started
               </button>
            </div>

            {/* Pro Pack - Corrected Layout */}
            <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col text-white relative border border-slate-700">
               {/* Fixed Badge Position */}
               <div className="absolute top-0 right-0">
                  <div className="bg-yellow-400 text-slate-900 text-xs font-extrabold px-4 py-1.5 rounded-bl-xl rounded-tr-xl flex items-center gap-1 shadow-md">
                    <Star size={12} className="fill-slate-900" /> BEST VALUE
                  </div>
               </div>

               <div className="mb-6 mt-2">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Power User</span>
               </div>
               
               <div className="flex items-baseline gap-1 mb-1">
                 <h3 className="text-4xl font-bold text-white">$19</h3>
                 <span className="text-slate-400 text-sm">/ once</span>
               </div>
               <p className="text-emerald-400 text-xs font-bold mb-2 flex items-center gap-1">
                 <TrendingUp size={12}/> SAVE 24% ($0.38 per credit)
               </p>
               <p className="text-slate-300 mb-6 text-sm">Massive volume for serious job hunters.</p>
               
               <div className="flex-grow space-y-4 mb-8">
                  <div className="flex gap-3 text-sm text-slate-200 bg-white/10 p-3 rounded-lg border border-white/20">
                    <Zap size={18} className="text-yellow-400 flex-shrink-0 fill-yellow-400" />
                    <span className="font-bold text-white">50 AI Credits</span>
                  </div>
                   <div className="flex gap-3 text-sm text-slate-200">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <span>Same Powerful AI Features</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-200">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <span>Bulk PDF Exports</span>
                  </div>
                  <div className="flex gap-3 text-sm text-slate-200">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <span>Credits Never Expire</span>
                  </div>
               </div>
               
               <button onClick={onBuy} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                  Get Pro Pack
               </button>
            </div>
         </div>

         {/* FAQ Section */}
         <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-600"/> Is there a difference in features?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                     No! Both the Starter Pack and Pro Pack give you full access to all AI features (Tailoring, Translation, PDF Export). The Pro Pack simply offers a significant discount on the cost per credit.
                  </p>
               </div>
               
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-600"/> How do credits work?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                     One credit = One major action. Tailoring your resume to a job description costs 1 credit. Downloading the final high-quality PDF costs 1 credit. Minor manual edits are always free.
                  </p>
               </div>

               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-600"/> Do credits expire?</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                     No. Once you purchase credits, they are yours forever until you use them. There are no monthly fees or expiration dates.
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
