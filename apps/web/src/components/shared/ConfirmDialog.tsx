"use client";

import { AlertTriangle, X } from "lucide-react";

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
  danger = false,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#f59e0b]" />
            <h2 className="font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#6b6988] hover:bg-surface-overlay hover:text-[#f1f0ff]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-[#a09ec0]">{description}</p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[#a09ec0] hover:bg-surface-overlay"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={
                danger
                  ? "rounded-md bg-[#ef4444] px-4 py-2 text-sm font-medium text-white hover:bg-[#dc2626]"
                  : "rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400"
              }
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
