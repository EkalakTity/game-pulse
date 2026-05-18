"use client";

import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import type { SafeSocialAccount } from "@/lib/api/socialAccounts";
import { PLATFORM_META } from "@/lib/platforms";

type Props = {
  account: SafeSocialAccount;
  onEdit: (account: SafeSocialAccount) => void;
  onToggle: (account: SafeSocialAccount) => void;
  onDelete: (id: string) => void;
};

export function SocialAccountCard({ account, onEdit, onToggle, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = PLATFORM_META[account.platform];

  return (
    <div className="relative flex items-center gap-4 rounded-xl border border-[#2e2e3e] bg-[#1c1c27] px-4 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        {meta.label.slice(0, 2).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#f1f0ff]">{account.accountName}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-xs" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[#3e3e5e]">·</span>
          <span className="text-xs text-[#6b6988]">{account.accountId}</span>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          account.isActive
            ? "bg-green-900/30 text-green-400"
            : "bg-[#2e2e3e] text-[#6b6988]"
        }`}
      >
        {account.isActive ? "Active" : "Paused"}
      </span>

      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-1.5 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-[#f1f0ff] transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-[#2e2e3e] bg-[#18181f] py-1 shadow-xl">
              <button
                onClick={() => { onEdit(account); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]"
              >
                <Pencil size={14} /> Edit token
              </button>
              <button
                onClick={() => { onToggle(account); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff]"
              >
                {account.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                {account.isActive ? "Pause" : "Activate"}
              </button>
              <div className="my-1 border-t border-[#2e2e3e]" />
              <button
                onClick={() => { onDelete(account.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#222230]"
              >
                <Trash2 size={14} /> Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
