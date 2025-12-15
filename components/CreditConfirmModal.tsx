import React from "react";
import { Zap, X } from "lucide-react";

interface CreditConfirmModalProps {
  open: boolean;
  credits: number;
  cost: number;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CreditConfirmModal: React.FC<CreditConfirmModalProps> = ({
  open,
  credits,
  cost,
  actionLabel,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[360px] p-6 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Zap className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Confirm credit usage
          </h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          <strong>{actionLabel}</strong> will cost{" "}
          <span className="font-mono font-bold text-indigo-600">
            {cost} credit{cost > 1 ? "s" : ""}
          </span>.
        </p>

        <div className="text-xs text-slate-500 mb-4">
          Remaining after action:{" "}
          <span className="font-mono font-semibold">
            {credits - cost}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
