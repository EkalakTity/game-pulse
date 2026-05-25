"use client";

import { useState } from "react";
import { CheckCircle, RefreshCw, Archive, FileText, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CategoryPill } from "@/components/categories/CategoryPill";
import { resolveImageUrl } from "@/lib/utils/cloudinary";
import type { Article, FeedSource, Category, Media } from "@gamepulse/database";

type ArticleWithRelations = Article & {
  source: FeedSource;
  categories: { category: Category }[];
  media: Media[];
};

type Props = {
  article: ArticleWithRelations;
  allCategories: Pick<Category, "id" | "name" | "color">[];
};

function formatDate(d: Date): string {
  return d.toLocaleString("en-GB", { timeZone: "UTC", hour12: false });
}

const STATUS_TRANSITIONS: Record<string, { label: string; icon: React.ReactNode; next: string }[]> = {
  DRAFT:     [{ label: "Publish",  icon: <CheckCircle size={14} />, next: "PUBLISHED" }, { label: "Archive", icon: <Archive size={14} />, next: "ARCHIVED" }],
  PUBLISHED: [{ label: "Archive",  icon: <Archive size={14} />,     next: "ARCHIVED"  }, { label: "Revert to Draft", icon: <FileText size={14} />, next: "DRAFT" }],
  ARCHIVED:  [{ label: "Restore",  icon: <RefreshCw size={14} />,   next: "DRAFT"     }],
  DUPLICATE: [],
};

export function ArticleDetailClient({ article, allCategories }: Props) {
  const [status, setStatus]         = useState(article.status);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    article.categories.map((c) => c.category.id),
  );
  const [saving, setSaving]         = useState(false);
  const [catSaving, setCatSaving]   = useState(false);
  const [feedback, setFeedback]     = useState<string | null>(null);
  const [imgError, setImgError]     = useState(false);

  async function changeStatus(nextStatus: string) {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setStatus(nextStatus as typeof status);
        setFeedback("Status updated");
      } else {
        setFeedback("Failed to update status");
      }
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function saveCategories() {
    setCatSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: selectedCats }),
      });
      if (res.ok) setFeedback("Categories saved");
      else setFeedback("Failed to save categories");
    } finally {
      setCatSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  function toggleCat(id: string) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const transitions = STATUS_TRANSITIONS[status] ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Hero image */}
        {(() => {
          const cloudMedia = article.media[0];
          const heroSrc = !imgError && (cloudMedia
            ? resolveImageUrl(cloudMedia.storedUrl, cloudMedia.storedPath, "hero")
            : article.thumbnailUrl ?? null);
          return heroSrc ? (
            <img
              src={heroSrc}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full rounded-xl object-cover max-h-72 border border-surface-border"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-surface-border text-sm text-[#6b6988]">
              No thumbnail
            </div>
          );
        })()}

        {/* AI Summary (Thai) */}
        {article.aiSummary && (
          <div className="rounded-xl border border-brand-400/30 bg-brand-400/5 p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-300">สรุปข่าว (AI)</h2>
            <p className="text-sm leading-relaxed text-[#f1f0ff]">{article.aiSummary}</p>
          </div>
        )}

        {/* Original Summary */}
        {article.summary && (
          <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b6988]">Summary</h2>
            <p className="text-sm leading-relaxed text-[#a09ec0]">{article.summary}</p>
          </div>
        )}

        {/* Full content */}
        {article.content && (
          <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b6988]">Content</h2>
            <div
              className="prose prose-invert prose-sm max-w-none text-[#a09ec0] [&_img]:rounded [&_img]:max-w-full [&_a]:text-brand-300 [&_figure]:my-3 [&_figcaption]:text-xs [&_figcaption]:text-[#6b6988]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Feedback toast */}
        {feedback && (
          <div className={`rounded-lg px-4 py-2 text-sm border ${
            feedback.startsWith("Failed")
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]"
          }`}>
            {feedback}
          </div>
        )}

        {/* Status card */}
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b6988]">Status</h2>
          <StatusBadge status={status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DUPLICATE"} />
          {transitions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {transitions.map((t) => (
                <button
                  key={t.next}
                  onClick={() => changeStatus(t.next)}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-overlay px-3 py-1.5 text-xs text-[#a09ec0] hover:border-brand-400 hover:text-brand-300 disabled:opacity-50"
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Score card */}
        {article.aiScore !== null && (
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b6988]">คะแนนข่าว</h2>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold tabular-nums ${
                article.aiScore >= 80 ? "text-[#22c55e]" :
                article.aiScore >= 60 ? "text-[#f59e0b]" :
                                        "text-[#ef4444]"
              }`}>
                {article.aiScore}
              </span>
              <span className="text-xs text-[#6b6988]">/ 100</span>
            </div>
            {article.aiScoreReason && (
              <p className="text-xs text-[#a09ec0] leading-relaxed">{article.aiScoreReason}</p>
            )}
          </div>
        )}

        {/* Source card */}
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b6988]">Source</h2>
          <div className="flex items-center gap-2">
            {article.source.logoUrl && (
              <img src={article.source.logoUrl} alt="" className="h-5 w-5 rounded object-cover" />
            )}
            <span className="text-sm text-[#f1f0ff]">{article.source.name}</span>
          </div>
          {article.source.url && (
            <a
              href={article.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#6b6988] hover:text-brand-300 truncate block"
            >
              {article.source.url}
            </a>
          )}
        </div>

        {/* Metadata card */}
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b6988]">Details</h2>
          <MetaRow label="Author"    value={article.author ?? "—"} />
          <MetaRow label="Published" value={article.publishedAt ? formatDate(new Date(article.publishedAt)) : "—"} />
          <MetaRow label="Ingested"  value={formatDate(new Date(article.createdAt))} />
          {article.externalId && <MetaRow label="External ID" value={article.externalId} mono />}
          <div className="pt-1">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-300 hover:underline"
            >
              <ExternalLink size={11} />
              View original article
            </a>
          </div>
        </div>

        {/* Categories card */}
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b6988]">Categories</h2>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.map((cat) => {
              const active = selectedCats.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity ${
                    active ? "opacity-100" : "opacity-30 hover:opacity-60"
                  }`}
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color,
                    borderColor: `${cat.color}40`,
                    border: "1px solid",
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
          <button
            onClick={saveCategories}
            disabled={catSaving}
            className="w-full rounded-md bg-brand-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {catSaving ? "Saving…" : "Save categories"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-[#6b6988] shrink-0">{label}</span>
      <span className={`text-[#a09ec0] text-right break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
