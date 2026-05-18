"use client";

import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationCenter } from "./NotificationCenter";

type Props = {
  user: { name?: string | null; email?: string | null };
};

export function TopNav({ user }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#2e2e3e] bg-[#18181f] px-6">
      <div />
      <div className="flex items-center gap-4">
        <NotificationCenter />

        <div className="flex items-center gap-2 text-sm text-[#a09ec0]">
          <User size={16} />
          <span>{user.name ?? user.email}</span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[#a09ec0] transition-colors hover:bg-[#222230] hover:text-[#ef4444]"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </header>
  );
}
