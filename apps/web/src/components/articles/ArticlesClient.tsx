"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ChevronDown, RefreshCw, ExternalLink, Image as ImageIcon, Eye, Archive, Tag, X } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CategoryPill } from "@/components/categories/CategoryPill";
import { cn } from "@/lib/utils/cn";
import { resolveImageUrl } from "@/lib/utils/cloudinary";
import type { Article, FeedSource, Category, Media } from "@gamepulse/database";

type ArticleWithRelations = Article & {
  source: Pick<FeedSource, "id" | "name" | "logoUrl">;
  categories: { category: Pick<Category, "id" | "name" | "color"> }[];
  media?: Pick<Media, "storedUrl" | "storedPath">[];
};

type Props = {
  sources: Pick<FeedSource, "id" | "name">[];
  categories: Pick<Category, "id" | "name" | "color">[];
};

type Filters = {
  status: string;
  sourceId: string;
  categoryId: string;
  q: string;
};

const STATUS_OPTIONS = ["", "DRAFT", "PUBLISHED", "ARCHIVED", "DUPLICATE"] as const;

export function ArticlesClient({ sources, categories }: Props) {
  const [articles, setArticles]       = useState<ArticleWithRelations[]>([]);
  const [loading, setLoading]         = useState(true);
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [hasMore, setHasMore]         = useState(false);
  const [filters, setFilters]         = useState<Filters>({ status: "", sourceId: "", categoryId: "", q: "" });
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction]   = useState<"ARCHIVE" | "CATEGORIZE" | null>(null);
  const [bulkCatIds, setBulkCatIds]   = useState<string[]>([]);
  const [bulkSaving, setBulkSaving]   = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchArticles = useCallback(async (f: Filters, cursor?: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (f.status)     params.set("status", f.status);
      if (f.sourceId)   params.set("sourceId", f.sourceId);
      if (f.categoryId) params.set("categoryId", f.categoryId);
      if (f.q)          params.set("q", f.q);
      if (cursor)       params.set("cursor", cursor);
      params.set("limit", "20");

      const res  = await fetch(`/api/v1/articles?${params}`);
      const json = await res.json() as
        | { success: true;  data: ArticleWithRelations[]; meta: { nextCursor: string | null; hasMore: boolean } }
        | { success: false; error: { message: string } };

      if (!json.success) {
        setFetchError(json.error.message);
        return;
      }

      if (cursor) {
        setArticles((prev) => [...prev, ...json.data]);
      } else {
        setArticles(json.data);
        setSelected(new Set());
      }
      setNextCursor(json.meta.nextCursor);
      setHasMore(json.meta.hasMore);
    } catch {
      setFetchError("Failed to load articles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchArticles(filters);
  }, [filters.status, filters.sourceId, filters.categoryId, fetchArticles]);

  // Auto-refresh while any visible article is still pending AI processing
  useEffect(() => {
    const hasPending = articles.some((a) => a.aiScore === null);
    if (!hasPending) return;
    const timer = setInterval(() => void fetchArticles(filters), 20_000);
    return () => clearInterval(timer);
  }, [articles, filters, fetchArticles]);

  function handleSearchChange(q: string) {
    setFilters((f) => ({ ...f, q }));
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void fetchArticles({ ...filters, q });
    }, 400);
  }

  function setFilter<K extends keyof Filters>(key: K, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    void fetchArticles(next);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === articles.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(articles.map((a) => a.id)));
    }
  }

  async function executeBulk() {
    if (!bulkAction || selected.size === 0) return;
    setBulkSaving(true);
    try {
      await fetch("/api/v1/articles/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selected],
          action: bulkAction,
          payload: bulkAction === "CATEGORIZE" ? { categoryIds: bulkCatIds } : undefined,
        }),
      });
      setSelected(new Set());
      setBulkAction(null);
      setBulkCatIds([]);
      void fetchArticles(filters);
    } finally {
      setBulkSaving(false);
    }
  }

  const allSelected = articles.length > 0 && selected.size === articles.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6988]" />
          <input
            type="search"
            placeholder="Search articles…"
            value={filters.q}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-56 rounded-md border border-surface-border bg-surface-overlay py-2 pl-8 pr-3 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-brand-400 focus:outline-none"
          />
        </div>

        <FilterSelect value={filters.status} onChange={(v) => setFilter("status", v)} placeholder="All statuses">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || "All statuses"}</option>
          ))}
        </FilterSelect>

        <FilterSelect value={filters.sourceId} onChange={(v) => setFilter("sourceId", v)} placeholder="All sources">
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </FilterSelect>

        <FilterSelect value={filters.categoryId} onChange={(v) => setFilter("categoryId", v)} placeholder="All categories">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </FilterSelect>

        {loading && <RefreshCw size={14} className="animate-spin text-[#6b6988]" />}
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-400/30 bg-brand-400/10 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-300">{selected.size} selected</span>
          <div className="h-4 w-px bg-surface-border" />

          <button
            onClick={() => { setBulkAction("ARCHIVE"); setBulkCatIds([]); }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              bulkAction === "ARCHIVE"
                ? "bg-[#ef4444]/20 text-[#ef4444]"
                : "text-[#a09ec0] hover:bg-surface-overlay hover:text-[#f1f0ff]",
            )}
          >
            <Archive size={13} />
            Archive
          </button>

          <button
            onClick={() => setBulkAction(bulkAction === "CATEGORIZE" ? null : "CATEGORIZE")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              bulkAction === "CATEGORIZE"
                ? "bg-brand-400/20 text-brand-300"
                : "text-[#a09ec0] hover:bg-surface-overlay hover:text-[#f1f0ff]",
            )}
          >
            <Tag size={13} />
            Categorize
          </button>

          {bulkAction === "CATEGORIZE" && (
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => {
                const active = bulkCatIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setBulkCatIds((prev) =>
                        prev.includes(cat.id) ? prev.filter((x) => x !== cat.id) : [...prev, cat.id],
                      )
                    }
                    className={cn("rounded-full px-2 py-0.5 text-xs font-medium transition-opacity border", active ? "opacity-100" : "opacity-40 hover:opacity-70")}
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                      borderColor: `${cat.color}40`,
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}

          {bulkAction && (
            <button
              onClick={executeBulk}
              disabled={bulkSaving || (bulkAction === "CATEGORIZE" && bulkCatIds.length === 0)}
              className="ml-auto rounded-md bg-brand-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {bulkSaving ? "Applying…" : "Apply"}
            </button>
          )}

          <button
            onClick={() => { setSelected(new Set()); setBulkAction(null); }}
            className="ml-auto text-[#6b6988] hover:text-[#f1f0ff]"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-[#6b6988]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-surface-border accent-brand-400 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 font-medium w-10" />
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Source</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Categories</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Score</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Published</th>
              <th className="px-4 py-3 font-medium w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {fetchError && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-[#ef4444]">
                  {fetchError}
                </td>
              </tr>
            )}
            {!fetchError && articles.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-[#6b6988]">
                  No articles found.
                </td>
              </tr>
            )}
            {articles.map((article) => (
              <tr
                key={article.id}
                className={cn(
                  "group hover:bg-surface-overlay",
                  selected.has(article.id) && "bg-brand-400/5",
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(article.id)}
                    onChange={() => toggleSelect(article.id)}
                    className="h-4 w-4 rounded border-surface-border accent-brand-400 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <ThumbnailCell article={article} />
                </td>
                <td className="px-4 py-3">
                  <p className="line-clamp-2 font-medium text-[#f1f0ff] leading-snug">
                    {article.title}
                  </p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-[#a09ec0]">{article.source.name}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {article.categories.slice(0, 2).map(({ category }) => (
                      <CategoryPill key={category.id} name={category.name} color={category.color} />
                    ))}
                    {article.categories.length > 2 && (
                      <span className="text-xs text-[#6b6988]">+{article.categories.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={article.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DUPLICATE"} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <AiScoreBadge score={article.aiScore} reason={article.aiScoreReason} />
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-[#6b6988]">
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("en-GB", { timeZone: "UTC" })
                      : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link
                      href={`/articles/${article.id}`}
                      className="text-[#6b6988] hover:text-brand-300"
                      aria-label="View detail"
                    >
                      <Eye size={14} />
                    </Link>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6b6988] hover:text-brand-300"
                      aria-label="Open original"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => { if (nextCursor) void fetchArticles(filters, nextCursor); }}
            disabled={loading}
            className="rounded-md border border-surface-border px-5 py-2 text-sm text-[#a09ec0] hover:bg-surface-overlay disabled:opacity-60"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

function ThumbnailCell({ article }: { article: ArticleWithRelations }) {
  const [imgError, setImgError] = useState(false);
  const cloudMedia = article.media?.[0];
  const imgSrc = !imgError && (cloudMedia
    ? resolveImageUrl(cloudMedia.storedUrl, cloudMedia.storedPath, "thumbnail")
    : article.thumbnailUrl ?? null);

  return imgSrc ? (
    <img
      src={imgSrc}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className="h-14 w-14 rounded object-cover"
    />
  ) : (
    <div className="flex h-14 w-14 items-center justify-center rounded bg-surface-border">
      <ImageIcon size={14} className="text-[#6b6988]" />
    </div>
  );
}

function AiScoreBadge({ score, reason }: { score: number | null; reason: string | null }) {
  if (score === null) {
    return <span className="text-xs text-[#6b6988]">—</span>;
  }

  const color =
    score >= 80 ? "text-[#22c55e]" :
    score >= 60 ? "text-[#f59e0b]" :
                  "text-[#ef4444]";

  return (
    <span
      className={cn("text-xs font-semibold tabular-nums cursor-default", color)}
      title={reason ?? undefined}
    >
      {score}
    </span>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-surface-border bg-surface-overlay py-2 pl-3 pr-7 text-sm text-[#f1f0ff] focus:border-brand-400 focus:outline-none"
      >
        {children}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6988]" />
    </div>
  );
}
