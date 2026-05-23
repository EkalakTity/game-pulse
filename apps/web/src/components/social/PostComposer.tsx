"use client";

import { useState, useEffect } from "react";
import { X, Hash, Calendar, Send, Sparkles, CheckCheck, MessageSquare, ChevronDown } from "lucide-react";
import type { SafeSocialAccount } from "@/lib/api/socialAccounts";
import type { SocialPostWithRelations } from "@/server/repositories/SocialPostRepository";
import { PLATFORM_META } from "@/lib/platforms";
import { socialPostsApi, type CreatePostPayload } from "@/lib/api/socialPosts";
import { articlesApi, type AiSuggestion } from "@/lib/api/articles";

export type ArticleOption = { id: string; title: string; url: string; thumbnailUrl: string | null };

type Props = {
  accounts: SafeSocialAccount[];
  articles: ArticleOption[];
  onCreated: (post: SocialPostWithRelations) => void;
  onClose: () => void;
};

const PLATFORM_KEY_MAP: Record<string, keyof AiSuggestion["captions"]> = {
  FACEBOOK: "fb",
  INSTAGRAM: "ig",
  TIKTOK: "tiktok",
  LINE_OA: "line",
};

export function PostComposer({ accounts, articles, onCreated, onClose }: Props) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [articleId, setArticleId] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [adComment, setAdComment] = useState("");
  const [adCommentOpen, setAdCommentOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!articleId) {
      setMediaUrls([]);
      return;
    }
    const article = articles.find((a) => a.id === articleId);
    if (!article) return;
    setCaption(`${article.title}\n\n${article.url}`);
    setMediaUrls(article.thumbnailUrl ? [article.thumbnailUrl] : []);
    setAiSuggestion(null);
  }, [articleId, articles]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const meta = selectedAccount ? PLATFORM_META[selectedAccount.platform] : null;
  const captionLimit = meta?.captionLimit ?? 2200;
  const captionLeft = captionLimit - caption.length;

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  }

  function removeHashtag(tag: string) {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  }

  async function fetchAiSuggestion() {
    if (!articleId) return;
    setAiLoading(true);
    setError("");
    setAiSuggestion(null);
    try {
      const result = await articlesApi.processAi(articleId);
      setAiSuggestion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiSuggestion() {
    if (!aiSuggestion || !selectedAccount) return;
    const key = PLATFORM_KEY_MAP[selectedAccount.platform] ?? "fb";
    const suggestedCaption = aiSuggestion.captions[key];
    if (suggestedCaption) setCaption(suggestedCaption.slice(0, captionLimit));
    if (aiSuggestion.hashtags.length > 0) setHashtags(aiSuggestion.hashtags);
    setAiSuggestion(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!accountId) { setError("Select an account."); return; }
    if (!caption.trim() && hashtags.length === 0) {
      setError("Add a caption or hashtags.");
      return;
    }
    if (scheduleMode && !scheduledAt) { setError("Pick a scheduled date/time."); return; }

    setLoading(true);
    try {
      const payload: CreatePostPayload = {
        accountId,
        ...(articleId && { articleId }),
        caption: caption.trim() || undefined,
        hashtags,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        scheduledAt: scheduleMode ? new Date(scheduledAt).toISOString() : undefined,
        ...(adComment.trim() && { adComment: adComment.trim() }),
      };
      const post = await socialPostsApi.create(payload);
      onCreated(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#2e2e3e] bg-[#18181f] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2e2e3e] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#f1f0ff]">Compose post</h2>
          <button onClick={onClose} className="text-[#6b6988] hover:text-[#f1f0ff]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Account selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] focus:border-[#8b5cf6] focus:outline-none"
            >
              {accounts.length === 0 && (
                <option value="">No accounts connected</option>
              )}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {PLATFORM_META[a.platform].label} — {a.accountName}
                </option>
              ))}
            </select>
          </div>

          {/* Article picker + AI button */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">
              Article <span className="text-[#6b6988]">(optional)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={articleId}
                onChange={(e) => {
                setArticleId(e.target.value);
                setCaption("");
                setAiSuggestion(null);
              }}
                className="flex-1 rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] focus:border-[#8b5cf6] focus:outline-none"
              >
                <option value="">No article</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title.length > 55 ? a.title.slice(0, 55) + "…" : a.title}
                  </option>
                ))}
              </select>
              {articleId && (
                <button
                  type="button"
                  onClick={fetchAiSuggestion}
                  disabled={aiLoading}
                  title="Generate AI caption & hashtags"
                  className="flex items-center gap-1.5 rounded-md border border-[#6d28d9]/60 bg-[#6d28d9]/10 px-3 py-2 text-xs font-medium text-[#8b5cf6] hover:bg-[#6d28d9]/20 disabled:opacity-50 transition-colors"
                >
                  <Sparkles size={13} />
                  {aiLoading ? "Generating…" : "AI"}
                </button>
              )}
            </div>
          </div>

          {/* AI suggestion panel */}
          {aiSuggestion && selectedAccount && (
            <div className="rounded-lg border border-[#6d28d9]/40 bg-[#6d28d9]/10 p-3 space-y-2">
              <p className="text-xs font-medium text-[#8b5cf6]">
                AI suggestion for {PLATFORM_META[selectedAccount.platform].label}
              </p>
              <p className="text-xs text-[#c4c2e0] leading-relaxed">
                {aiSuggestion.captions[PLATFORM_KEY_MAP[selectedAccount.platform] ?? "fb"]}
              </p>
              {aiSuggestion.hashtags.length > 0 && (
                <p className="text-xs text-[#8b5cf6]/80">
                  #{aiSuggestion.hashtags.join(" #")}
                </p>
              )}
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={applyAiSuggestion}
                  className="flex items-center gap-1.5 rounded-md bg-[#6d28d9] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7c3aed] transition-colors"
                >
                  <CheckCheck size={12} />
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="rounded-md px-3 py-1.5 text-xs text-[#6b6988] hover:text-[#a09ec0] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Caption */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-[#a09ec0]">Caption</label>
              <span
                className={`text-xs ${captionLeft < 50 ? "text-red-400" : captionLeft < 200 ? "text-yellow-400" : "text-[#6b6988]"}`}
              >
                {captionLeft.toLocaleString("en-US")} left
              </span>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={captionLimit}
              rows={4}
              placeholder="Write your caption…"
              className="w-full resize-none rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#a09ec0]">Hashtags</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6988]"
                />
                <input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addHashtag();
                    }
                  }}
                  placeholder="gaming"
                  className="w-full rounded-md border border-[#2e2e3e] bg-[#111118] py-2 pl-7 pr-3 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addHashtag}
                className="rounded-md border border-[#2e2e3e] px-3 py-2 text-xs text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff] transition-colors"
              >
                Add
              </button>
            </div>
            {hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-[#6d28d9]/20 px-2 py-0.5 text-xs text-[#8b5cf6]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="text-[#6b6988] hover:text-[#f1f0ff]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ad Comment */}
          <div>
            <button
              type="button"
              onClick={() => setAdCommentOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                adCommentOpen
                  ? "border-[#6d28d9] bg-[#6d28d9]/20 text-[#8b5cf6]"
                  : "border-[#2e2e3e] text-[#a09ec0] hover:bg-[#222230]"
              }`}
            >
              <MessageSquare size={13} />
              Ad Comment
              <ChevronDown
                size={12}
                className={`ml-auto transition-transform ${adCommentOpen ? "rotate-180" : ""}`}
              />
            </button>
            {adCommentOpen && (
              <div className="mt-2">
                <textarea
                  value={adComment}
                  onChange={(e) => setAdComment(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Write an ad comment to auto-post after publishing…"
                  className="w-full resize-none rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#8b5cf6] focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-[#6b6988]">
                  {2000 - adComment.length} left
                </p>
              </div>
            )}
          </div>

          {/* Schedule toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScheduleMode((v) => !v)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                scheduleMode
                  ? "border-[#6d28d9] bg-[#6d28d9]/20 text-[#8b5cf6]"
                  : "border-[#2e2e3e] text-[#a09ec0] hover:bg-[#222230]"
              }`}
            >
              <Calendar size={13} /> Schedule
            </button>
            {scheduleMode && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="flex-1 rounded-md border border-[#2e2e3e] bg-[#111118] px-3 py-2 text-xs text-[#f1f0ff] focus:border-[#8b5cf6] focus:outline-none"
              />
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[#a09ec0] hover:text-[#f1f0ff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || accounts.length === 0}
              className="flex items-center gap-2 rounded-md bg-[#6d28d9] px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
            >
              <Send size={13} />
              {loading ? "Posting…" : scheduleMode ? "Schedule" : "Post now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
