
import React, { useState } from 'react';
import { ArrowLeft, Mail, MapPin, Send, Bot } from 'lucide-react';
import { Logo } from './Logo';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
           <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
             <ArrowLeft size={20} /> Back to App
           </button>
           <Logo />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Contact Info */}
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Get in Touch</h1>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed">
              Have questions about OneClickCVPro? Need help with your account or have a feature request? We'd love to hear from you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Email Us</h3>
                  <p className="text-slate-500 mb-2">For general inquiries and support.</p>
                  <a href="mailto:contact@oneclickcvpro.com" className="text-indigo-600 font-bold hover:underline">contact@oneclickcvpro.com</a>
                </div>
              </div>

              {/* Info about AI Support */}
              <div className="flex items-start gap-4 group w-full">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
                    AI Support Companion
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">Online</span>
                  </h3>
                  <p className="text-slate-500 mb-2">
                    Use the chat button in the bottom right corner for instant answers about billing, features, or to get help editing your resume.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Office</h3>
                  <p className="text-slate-500">
                    OneClickCVPro HQ<br/>
                    Altstetterstrasse<br/>
                    8047 Zurich, Switzerland
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <Send size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h2>
                <p className="text-slate-500 max-w-xs mx-auto">
                  Thank you for reaching out. We usually respond within 24 hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-indigo-600 font-bold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                  <select 
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white"
                  >
                    <option value="">Select a topic...</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing & Credits</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow h-32 resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Send Message
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};
