"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { SocialPlatform } from "@gamepulse/database";
import type { SafeSocialAccount, CreateAccountPayload } from "@/lib/api/socialAccounts";
import { PLATFORM_META } from "@/lib/platforms";

type Props = {
  initial?: SafeSocialAccount;
  onSubmit: (values: CreateAccountPayload) => Promise<void>;
  onClose: () => void;
};

const PLATFORMS: SocialPlatform[] = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINE_OA"];

export function SocialAccountForm({ initial, onSubmit, onClose }: Props) {
  const [platform, setPlatform] = useState<SocialPlatform>(initial?.platform ?? "FACEBOOK");
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!accountName.trim() || !accountId.trim() || (!initial && !accessToken.trim())) {
      setError("Account name, account ID, and access token are required.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        platform,
        accountName: accountName.trim(),
        accountId: accountId.trim(),
        accessToken: accessToken.trim(),
        ...(refreshToken.trim() && { refreshToken: refreshToken.trim() }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2e2e3e] bg-[#18181f] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2e2e3e] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#f1f0ff]">
            {initial ? "Edit social account" : "Connect social account"}
          </h2>
          <button onClick={onClose} className="text-[#6b6988] hover:text-[#f1f0ff]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {!initial && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => {
                  const meta = PLATFORM_META[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors"
                      style={{
                        borderColor: platform === p ? meta.color : "#2e2e3e",
                        backgroundColor: platform === p ? meta.bg : "transparent",
                        color: platform === p ? meta.color : "#a09ec0",
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">Account name</label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="My Facebook Page"
              className="w-full rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
            />
          </div>

          {!initial && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">
                Account / Page ID
              </label>
              <input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="123456789"
                className="w-full rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">
              Access token {initial && <span className="text-[#6b6988]">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">
              Refresh token <span className="text-[#6b6988]">(optional)</span>
            </label>
            <input
              type="password"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[#a09ec0] hover:text-[#f1f0ff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[#6d28d9] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : initial ? "Save changes" : "Connect account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
