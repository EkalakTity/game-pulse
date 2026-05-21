"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Gamepad2, Rss, Plus, Check, Loader2, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";

type CatalogFeed = {
  name: string;
  url: string;
  description: string;
  fetchIntervalMin: number;
};

type CatalogGame = {
  slug: string;
  name: string;
  genre: string;
  aliases: string[];
  imageUrl?: string;
  feeds: CatalogFeed[];
};

type Props = {
  watchedSlugs: string[];
  onAdd: (slug: string) => Promise<void>;
  onClose: () => void;
};

export function AddGameDialog({ watchedSlugs, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ games: CatalogGame[] }>(`/games/catalog?q=${encodeURIComponent(q)}`);
      setGames(res.games);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => { search(""); }, [search]);

  const handleAdd = async (slug: string) => {
    setAdding(slug);
    try {
      await onAdd(slug);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[#2e2e3e] bg-[#18181f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2e2e3e] px-5 py-4">
          <div>
            <h2 className="font-semibold text-[#f1f0ff]">Watch a Game</h2>
            <p className="mt-0.5 text-xs text-[#6b6988]">RSS feeds will be added automatically</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-[#f1f0ff] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-[#2e2e3e] px-5 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6988]" />
            <input
              autoFocus
              type="search"
              placeholder="Search games…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-[#2e2e3e] bg-[#222230] py-2 pl-8 pr-3 text-sm text-[#f1f0ff] placeholder-[#6b6988] focus:border-[#6d28d9] focus:outline-none"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#6b6988]">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6b6988]">No games found for &ldquo;{query}&rdquo;</p>
          ) : (
            games.map((game) => {
              const isWatched = watchedSlugs.includes(game.slug);
              const isAdding = adding === game.slug;
              const isExpanded = expanded === game.slug;
              return (
                <div key={game.slug} className="rounded-lg border border-transparent hover:border-[#2e2e3e] hover:bg-[#1e1e2a] transition-colors">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded overflow-hidden bg-[#2e2e3e]">
                      {game.imageUrl ? (
                        <img src={game.imageUrl} alt={game.name} className="h-9 w-9 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Gamepad2 size={16} className="text-[#6b6988]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#f1f0ff]">{game.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#6b6988]">{game.genre}</span>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : game.slug)}
                          className="flex items-center gap-1 text-xs text-[#6b6988] hover:text-[#a09ec0]"
                        >
                          <Rss size={10} />
                          {game.feeds.length} feed{game.feeds.length !== 1 ? "s" : ""}
                        </button>
                      </div>
                    </div>
                    {isWatched ? (
                      <span className="flex items-center gap-1 rounded-full bg-[#6d28d9]/20 px-2.5 py-1 text-xs text-[#8b5cf6]">
                        <Check size={11} /> Watching
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(game.slug)}
                        disabled={isAdding}
                        className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
                      >
                        {isAdding ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                        Watch
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-[#2e2e3e] px-3 pb-2 pt-2 space-y-1">
                      {game.feeds.map((feed) => (
                        <div key={feed.url} className="flex items-start gap-2 text-xs text-[#6b6988]">
                          <Rss size={10} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[#a09ec0]">{feed.name}</span>
                            <span className="mx-1">—</span>
                            {feed.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
