import React from 'react';
import { ArrowLeft, Check, Linkedin, Zap, FileText, Layout, Wand2, Download, Globe } from 'lucide-react';
import { Logo } from './Logo';
import { ProductType } from '../types';

interface ProductPageProps {
  type: ProductType;
  onBack: () => void;
  onStart: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ type, onBack, onStart }) => {
  
  const content = {
    builder: {
      title: "The Ultimate Resume Builder",
      subtitle: "Build professional, ATS-optimized resumes in minutes. No design skills required.",
      icon: <Layout size={48} className="text-white" />,
      color: "bg-indigo-600",
      features: [
        { title: "Smart Templates", desc: "Choose from Classic, Modern, and Minimal layouts designed by HR pros." },
        { title: "Real-time Preview", desc: "See changes instantly as you type. What you see is what you get." },
        { title: "Export to PDF", desc: "Download high-quality PDFs ready for application systems." }
      ]
    },
    linkedin: {
      title: "LinkedIn to PDF",
      subtitle: "Convert your LinkedIn profile into a polished resume with one click.",
      icon: <Linkedin size={48} className="text-white" />,
      color: "bg-blue-600",
      features: [
        { title: "One-Click Import", desc: "Just upload your LinkedIn Profile PDF or paste the text. We handle the rest." },
        { title: "Smart Parsing", desc: "Our AI extracts skills, experience, and education into structured data." },
        { title: "Instant Formatting", desc: "Transform messy profile exports into clean, professional documents." }
      ]
    },
    tailoring: {
      title: "AI Resume Tailoring",
      subtitle: "Beat the ATS bots. Customize your resume for every single job application.",
      icon: <Wand2 size={48} className="text-white" />,
      color: "bg-purple-600",
      features: [
        { title: "Keyword Optimization", desc: "AI analyzes job descriptions to inject high-value keywords naturally." },
        { title: "Contextual Rewriting", desc: "Rewrite bullet points to match the tone and requirements of the role." },
        { title: "Score Higher", desc: "Increase your chances of passing automated screenings by up to 80%." }
      ]
    }
  };

  

  const data = content[type];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
           <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
             <ArrowLeft size={20} /> Back to App
           </button>
           <Logo />
        </div>
      </nav>

      {/* Hero */}
      <div className={`relative overflow-hidden ${data.color} text-white py-20 px-6`}>
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
           <svg viewBox="0 0 200 200" width="600" height="600" fill="currentColor">
             <path d="M45,-78C58,-69,68,-57,76,-44C84,-31,90,-16,89,-1C88,14,80,29,70,42C60,55,48,66,34,74C20,82,5,87,-10,87C-25,87,-40,82,-53,74C-66,65,-77,53,-84,39C-91,25,-94,9,-91,-6C-88,-21,-79,-35,-68,-47C-57,-59,-44,-69,-30,-77C-16,-85,-1,-91,15,-90C31,-89,45,-80,45,-78Z" transform="translate(100 100)" />
           </svg>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
           <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
             {data.icon}
           </div>
           <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">{data.title}</h1>
           <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
             {data.subtitle}
           </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {data.features.map((feature, idx) => (
            <div key={idx} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
               <div className={`w-12 h-12 ${data.color.replace('bg-', 'text-')} bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100`}>
                 <Check size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
               <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
          {/* Demo video */}
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="aspect-video bg-black">
              <video
                className="w-full h-full object-cover"
                src="/videos/demo.mp4"
                controls
                playsInline
                preload="metadata"
                poster="/images/demo-poster.jpg"
              />
            </div>
          
            <div className="p-4">
              <p className="text-sm font-semibold text-slate-900">
                Watch how it works in 30 seconds
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Import → tailor → export PDF.
              </p>
            </div>
          </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <div className="inline-block p-1 bg-slate-100 rounded-2xl mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto">
               <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to upgrade your job search?</h2>
               <p className="text-slate-600 mb-8">Join thousands of professionals landing interviews faster with OneClickCVPro.</p>
               <button 
                onClick={onStart}
                className={`px-10 py-4 ${data.color} text-white font-bold text-lg rounded-xl shadow-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto`}
              >
                Start for Free <ArrowLeft className="rotate-180" size={20}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
