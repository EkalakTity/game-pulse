import { TrendingUp, Flame, Newspaper, Share2 } from "lucide-react";
import type { TrendingCategory } from "@/server/services/TrendingService";

type Props = {
  trending: TrendingCategory[];
};

function TrendBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1 w-full rounded-full bg-[#2e2e3e]">
      <div
        className="h-1 rounded-full bg-[#6d28d9]/70 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function TrendingWidget({ trending }: Props) {
  const maxScore = trending[0]?.trendScore ?? 1;
  const surgingCount = trending.filter((c) => c.isSurging).length;

  return (
    <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-[#8b5cf6]" />
          <h2 className="text-base font-semibold text-[#f1f0ff]">Trending Topics</h2>
          <span className="text-xs text-[#6b6988]">last 24h</span>
        </div>
        {surgingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-400">
            <Flame size={11} />
            {surgingCount} surging
          </span>
        )}
      </div>

      {trending.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#6b6988]">
          No trending data yet — articles will appear once content is ingested.
        </p>
      ) : (
        <div className="space-y-3">
          {trending.map((cat, idx) => (
            <div key={cat.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 w-4 text-xs text-[#6b6988]">{idx + 1}</span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate text-sm font-medium text-[#f1f0ff]">
                    {cat.name}
                  </span>
                  {cat.isSurging && (
                    <span
                      className="shrink-0 flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400"
                      title={`${cat.changeVsBaseline > 0 ? "+" : ""}${cat.changeVsBaseline}% vs daily baseline`}
                    >
                      <Flame size={9} />
                      {cat.changeVsBaseline > 0 ? `+${cat.changeVsBaseline}%` : "surge"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="flex items-center gap-1 text-xs text-[#6b6988]">
                    <Newspaper size={10} />
                    {cat.articleCount24h}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#6b6988]">
                    <Share2 size={10} />
                    {cat.postCount24h}
                  </span>
                </div>
              </div>
              <TrendBar value={cat.trendScore} max={maxScore} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-[#2e2e3e] pt-3 text-xs text-[#6b6988]">
        <span className="flex items-center gap-1">
          <Newspaper size={10} /> articles ingested
        </span>
        <span className="flex items-center gap-1">
          <Share2 size={10} /> social posts
        </span>
        <span className="ml-auto">
          surge = 2× daily baseline
        </span>
      </div>
    </div>
  );
}
