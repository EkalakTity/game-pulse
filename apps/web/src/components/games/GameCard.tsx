"use client";

import { Gamepad2, Rss, X } from "lucide-react";

type InterestedGame = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: Date | string;
};

type Props = {
  game: InterestedGame;
  feedCount: number;
  onRemove: (id: string) => void;
};

export function GameCard({ game, feedCount, onRemove }: Props) {
  return (
    <div className="relative flex items-center gap-4 rounded-lg border border-[#2e2e3e] bg-[#1e1e2a] p-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#2e2e3e]">
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt={game.name}
            className="h-12 w-12 rounded-md object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Gamepad2 size={22} className="text-[#6b6988]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[#f1f0ff]">{game.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6b6988]">
          <Rss size={11} />
          {feedCount} feed{feedCount !== 1 ? "s" : ""} tracked
        </p>
      </div>
      <button
        onClick={() => onRemove(game.id)}
        className="rounded-md p-1.5 text-[#6b6988] hover:bg-[#2e2e3e] hover:text-[#f87171] transition-colors"
        title="Stop watching"
      >
        <X size={15} />
      </button>
    </div>
  );
}
