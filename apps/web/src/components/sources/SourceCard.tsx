"use client";

import { RefreshCw, Pencil, Pause, Play, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";
import { SourceHealthBadge } from "./SourceHealthBadge";
import { cn } from "@/lib/utils/cn";
import type { FeedSource } from "@gamepulse/database";

type Props = {
  source: FeedSource;
  onEdit: (source: FeedSource) => void;
  onRefresh: (id: string) => Promise<void>;
  onTogglePause: (source: FeedSource) => Promise<void>;
  onDelete: (id: string) => void;
};

export function SourceCard({ source, onEdit, onRefresh, onTogglePause, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh(source.id);
    } finally {
      setRefreshing(false);
    }
  }

  const isPaused = source.status === "PAUSED";

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-raised p-4 transition-colors hover:border-[#3e3e52]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-[#f1f0ff]">{source.name}</p>
          <p className="mt-0.5 truncate text-xs text-[#6b6988]">{source.url}</p>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded p-1 text-[#6b6988] transition-colors hover:bg-surface-overlay hover:text-[#f1f0ff]"
            aria-label="Actions"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 w-40 rounded-lg border border-surface-border bg-surface-overlay py-1 shadow-xl">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(source); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[#a09ec0] hover:bg-surface-raised hover:text-[#f1f0ff]"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); void onTogglePause(source); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[#a09ec0] hover:bg-surface-raised hover:text-[#f1f0ff]"
                >
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <hr className="my-1 border-surface-border" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(source.id); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[#ef4444] hover:bg-surface-raised"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {source.status === "ERROR" && source.lastError ? (
        <p className="line-clamp-2 text-xs text-[#ef4444]/80" title={source.lastError}>{source.lastError}</p>
      ) : source.description ? (
        <p className="line-clamp-2 text-xs text-[#a09ec0]">{source.description}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <SourceHealthBadge lastFetchedAt={source.lastFetchedAt} status={source.status} />
        <span className="text-xs text-[#6b6988]">
          {source.articleCount.toLocaleString("en-US")} articles
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-surface-border pt-3">
        <span className="text-xs text-[#6b6988]">
          Every {source.fetchIntervalMin}m
        </span>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isPaused}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            refreshing || isPaused
              ? "cursor-not-allowed text-[#6b6988]"
              : "text-brand-300 hover:bg-brand-500/10",
          )}
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Fetching…" : "Refresh now"}
        </button>
      </div>
    </div>
  );
}
