

import React, { useState } from 'react';
import { Logo } from './Logo';
import { PageView } from '../types';

interface FooterProps {
  onNavigate: (page: PageView, subPage?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <Logo light className="mb-4" />
          <p className="text-sm text-slate-400 mb-6">
            The intelligent AI resume builder that turns your experience into opportunities. ATS-friendly, tailored, and instant.
          </p>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} OneClickCVPro.
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('product', 'builder')} className="hover:text-white transition-colors">Resume Builder</button></li>
            <li><button onClick={() => onNavigate('product', 'linkedin')} className="hover:text-white transition-colors">LinkedIn to PDF</button></li>
            <li><button onClick={() => onNavigate('product', 'tailoring')} className="hover:text-white transition-colors">AI Tailoring</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">About Us</button></li>
            <li><button onClick={() => onNavigate('blog')} className="hover:text-white transition-colors">Blog & Careers</button></li>
            <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact Support</button></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('legal', 'impressum')} className="hover:text-white transition-colors">Legal Notice</button></li>
            <li><button onClick={() => onNavigate('legal', 'privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
            <li><button onClick={() => onNavigate('legal', 'terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
          </ul>
        </div>

      </div>
    </footer>
  );
};