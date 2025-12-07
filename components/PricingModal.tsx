import React, { useState } from 'react';
import { X, Zap, Check, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';

const STRIPE_PUBLISHABLE_KEY = "pk_test_51SWcl5R39BynqI4Bq4eYjxMnCpXRr3Y0QXEq4Ap5Mb4VaiUD8BTWFYjs90cBFiCIDYlinnb39ptDk6ciXoTjBFsz00jIECG4zP"; 
const STRIPE_PRICES = {
  starter: "price_1SWco1R39BynqI4BpMS8S89b", 
  pro: "price_1SWcpaR39BynqI4BFu4QnT4e"
};

const SIMULATION_MODE = false; 
// If VITE_BACKEND_URL is set (Production), use it. 
// Otherwise default to "" to let Vite Proxy handle routing to localhost:4242
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || ""; 

interface PricingModalProps {
  onClose: () => void;
  onPurchase: (amount: number) => void;
  currentCredits: number;
  userId?: string; // Needed for backend fulfillment
}

declare const Stripe: any;

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, onPurchase, currentCredits, userId }) => {
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (amount: number, index: number, packType: 'starter' | 'pro') => {
    setIsProcessing(index);
    setError(null);

    if (SIMULATION_MODE) {
      setTimeout(() => {
        onPurchase(amount);
        setIsProcessing(null);
      }, 1500);
      return;
    }

    try {
      const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      
      const response = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: STRIPE_PRICES[packType],
          amount: amount,
          userId: userId // CRITICAL: Link payment to user in DB
        }),
      });

      if (!response.ok) {
        throw new Error("Backend connection failed.");
      }

      const session = await response.json();
      
      const result = await stripe.redirectToCheckout({ sessionId: session.id });
      if (result.error) setError(result.error.message);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Payment failed.");
      setIsProcessing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Sidebar */}
        <div className="bg-indigo-600 p-8 text-white md:w-1/3 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Logo light className="mb-6" />
            <h2 className="text-2xl font-bold mb-2">Unlock Pro Power</h2>
            <p className="text-indigo-100 text-sm mb-6">Generate tailored resumes, translate content, and rewrite with advanced AI models.</p>
            
            <div className="bg-indigo-800/50 rounded-xl p-4 backdrop-blur-sm border border-indigo-400/30">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">Current Balance</p>
              <div className="flex items-center gap-2">
                <Zap className="text-yellow-400 fill-yellow-400" size={24} />
                <span className="text-3xl font-bold">{currentCredits} Credits</span>
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50"></div>
          
          <div className="relative z-10 mt-8 text-xs text-indigo-200 flex items-center gap-2">
             <ShieldCheck size={14} /> Secure Payment via Stripe
          </div>
        </div>

        {/* Pricing Options */}
        <div className="p-8 md:w-2/3 bg-slate-50 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Select a Credit Pack</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all relative group">
              <h4 className="font-bold text-slate-800 text-lg">Starter Pack</h4>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-extrabold text-slate-900">$5</span>
                <span className="text-slate-500">/ one-time</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
                <Zap size={18} className="fill-indigo-100" />
                <span>10 Credits</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> 10 Tailored Resumes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Basic Translation</li>
              </ul>
              <button 
                onClick={() => handleBuy(10, 1, 'starter')}
                disabled={isProcessing !== null}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing === 1 ? <span className="animate-spin text-lg">⟳</span> : 'Buy Starter'}
              </button>
            </div>

            {/* Option 2 */}
            <div className="bg-white border-2 border-indigo-600 rounded-xl p-6 shadow-xl relative transform scale-105 sm:scale-100 md:scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Best Value
              </div>
              <h4 className="font-bold text-slate-800 text-lg">Pro Pack</h4>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-extrabold text-slate-900">$19</span>
                <span className="text-slate-500">/ one-time</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
                <Zap size={18} className="fill-indigo-600 text-yellow-400" />
                <span>50 Credits</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> 50 Tailored Resumes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Advanced AI Mode</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Priority Support</li>
              </ul>
              <button 
                onClick={() => handleBuy(50, 2, 'pro')}
                disabled={isProcessing !== null}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                {isProcessing === 2 ? <span className="animate-spin text-lg">⟳</span> : <><CreditCard size={16}/> Buy Pro</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}