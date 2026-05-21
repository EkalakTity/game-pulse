"use client";

import { useState, useCallback } from "react";
import { Plus, Gamepad2 } from "lucide-react";
import { GameCard } from "@/components/games/GameCard";
import { AddGameDialog } from "@/components/games/AddGameDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { apiClient } from "@/lib/api/client";
import { GAME_CATALOG } from "@/lib/gameFeedCatalog";

type InterestedGame = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: Date | string;
};

type Props = { initialGames: InterestedGame[] };

export function GamesClient({ initialGames }: Props) {
  const [games, setGames] = useState(initialGames);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<{ gameName: string; feedsAdded: number } | null>(null);

  const watchedSlugs = games.map((g) => g.slug);

  const getFeedCount = (slug: string) => {
    const entry = GAME_CATALOG.find((g) => g.slug === slug);
    return entry?.feeds.length ?? 0;
  };

  const handleAdd = useCallback(async (slug: string) => {
    const res = await apiClient.post<{ game: InterestedGame; feedsAdded: { isNew: boolean }[] }>("/games", { slug });
    setGames((prev) => [...prev, res.game]);
    const newFeeds = res.feedsAdded.filter((f) => f.isNew).length;
    setAddResult({ gameName: res.game.name, feedsAdded: newFeeds });
    setTimeout(() => setAddResult(null), 4000);
  }, []);

  const handleRemove = useCallback(async () => {
    if (!removeTarget) return;
    await apiClient.delete(`/games/${removeTarget}`);
    setGames((prev) => prev.filter((g) => g.id !== removeTarget));
    setRemoveTarget(null);
  }, [removeTarget]);

  const removeTargetGame = games.find((g) => g.id === removeTarget);

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#a09ec0]">
          {games.length} game{games.length !== 1 ? "s" : ""} watched
        </p>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] transition-colors"
        >
          <Plus size={16} /> Watch Game
        </button>
      </div>

      {/* Toast */}
      {addResult && (
        <div className="rounded-lg border border-[#6d28d9]/40 bg-[#6d28d9]/10 px-4 py-3 text-sm text-[#a09ec0]">
          Now watching <span className="font-medium text-[#f1f0ff]">{addResult.gameName}</span>
          {addResult.feedsAdded > 0 && (
            <> — <span className="text-[#8b5cf6]">{addResult.feedsAdded} new feed{addResult.feedsAdded !== 1 ? "s" : ""} added to sources</span></>
          )}
        </div>
      )}

      {/* Empty state */}
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2e2e3e] py-20 text-center">
          <Gamepad2 size={40} className="mb-4 text-[#2e2e3e]" />
          <p className="text-base font-medium text-[#a09ec0]">No games watched yet</p>
          <p className="mt-1 text-sm text-[#6b6988]">Search for a game and we&apos;ll find the RSS feeds for you</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-[#7c3aed] transition-colors"
          >
            <Plus size={16} /> Watch a Game
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              feedCount={getFeedCount(game.slug)}
              onRemove={(id) => setRemoveTarget(id)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {dialogOpen && (
        <AddGameDialog
          watchedSlugs={watchedSlugs}
          onAdd={handleAdd}
          onClose={() => setDialogOpen(false)}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          title="Stop watching game?"
          description={`Remove "${removeTargetGame?.name}" from your watched games. Existing feed sources will remain.`}
          confirmLabel="Stop watching"
          onConfirm={handleRemove}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </>
  );
}
