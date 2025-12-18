import React, { useState } from "react";
import { X, Zap, Check, CreditCard, ShieldCheck, AlertCircle, Star } from "lucide-react";
import { Logo } from "./Logo";

const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SWcl5R39BynqI4Bq4eYjxMnCpXRr3Y0QXEq4Ap5Mb4VaiUD8BTWFYjs90cBFiCIDYlinnb39ptDk6ciXoTjBFsz00jIECG4zP";
const STRIPE_PRICES = {
  starter: "price_1SWco1R39BynqI4BpMS8S89b",
  pro: "price_1SWcpaR39BynqI4BFu4QnT4e",
};

const SIMULATION_MODE = false;
const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || "";

interface PricingModalProps {
  onClose: () => void;
  onPurchase: (amount: number) => void;
  currentCredits: number;
  userId?: string;
}

declare const Stripe: any;

export const PricingModal: React.FC<PricingModalProps> = ({
  onClose,
  onPurchase,
  currentCredits,
  userId,
}) => {
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (amount: number, index: number, packType: "starter" | "pro") => {
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: STRIPE_PRICES[packType],
          amount,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Backend connection failed.");

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
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* modal shell */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl overflow-hidden">
        {/* header (always visible) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <Logo iconOnly className="w-7 h-7" />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate">Buy Credits</p>
              <p className="text-[11px] text-slate-500 truncate">
                Secure checkout via Stripe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* body scroll (inside modal) */}
        <div className="max-h-[75vh] overflow-y-auto bg-slate-50">
          <div className="p-4 sm:p-6 space-y-4">
            {/* balance card */}
            <div className="rounded-xl bg-indigo-600 text-white p-4 sm:p-5 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Current Balance
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Zap className="text-yellow-300 fill-yellow-300" size={20} />
                    <span className="text-2xl sm:text-3xl font-extrabold">
                      {currentCredits}
                    </span>
                    <span className="text-indigo-100 font-bold">Credits</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-indigo-100">
                  <ShieldCheck size={14} /> Stripe secure payment
                </div>
              </div>

              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50"></div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5" /> {error}
              </div>
            )}

            {/* packs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* starter */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900">Starter Pack</h4>
                  <span className="text-xs font-bold text-slate-500">$5</span>
                </div>

                <div className="flex items-center gap-2 text-indigo-700 font-bold mt-2">
                  <Zap size={16} className="fill-indigo-200 text-indigo-700" />
                  <span>10 Credits</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">$0.50 / credit</p>

                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" /> Full AI Access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" /> PDF Export
                  </li>
                </ul>

                <button
                  onClick={() => handleBuy(10, 1, "starter")}
                  disabled={isProcessing !== null}
                  className="mt-4 w-full py-3 rounded-lg font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing === 1 ? "Processing…" : "Buy Starter"}
                </button>
              </div>

              {/* pro */}
              <div className="bg-white border-2 border-indigo-600 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
                {/* Fixed Badge: Top Right Corner */}
                <div className="absolute top-0 right-0">
                   <div className="bg-indigo-600 text-white text-[9px] font-extrabold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                     <Star size={10} className="fill-white" /> BEST VALUE
                   </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <h4 className="font-extrabold text-slate-900">Pro Pack</h4>
                  <span className="text-xs font-bold text-slate-500">$19</span>
                </div>

                <div className="flex items-center gap-2 text-indigo-700 font-bold mt-2">
                  <Zap size={16} className="fill-indigo-600 text-yellow-300" />
                  <span>50 Credits</span>
                </div>
                <p className="text-[10px] text-emerald-600 mt-1 font-bold">Save 24% ($0.38 / credit)</p>

                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" /> Full AI Access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" /> Bulk PDF Export
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" /> Credits Never Expire
                  </li>
                </ul>

                <button
                  onClick={() => handleBuy(50, 2, "pro")}
                  disabled={isProcessing !== null}
                  className="mt-4 w-full py-3 rounded-lg font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing === 2 ? (
                    "Processing…"
                  ) : (
                    <>
                      <CreditCard size={16} /> Buy Pro
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* footer hint */}
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-500" />
              Payments are processed securely by Stripe. Credits are applied to your account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
