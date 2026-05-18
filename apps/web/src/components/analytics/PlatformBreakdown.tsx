import type { PlatformStat } from "@/server/services/AnalyticsService";
import { PLATFORM_META } from "@/lib/platforms";

type Props = { data: PlatformStat[] };

export function PlatformBreakdown({ data }: Props) {
  const maxPublished = Math.max(...data.map((d) => d.published), 1);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
        <h2 className="mb-4 text-base font-semibold text-[#f1f0ff]">By Platform</h2>
        <p className="text-sm text-[#6b6988]">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
      <h2 className="mb-4 text-base font-semibold text-[#f1f0ff]">By Platform</h2>
      <div className="space-y-3">
        {data.map((stat) => {
          const meta = PLATFORM_META[stat.platform];
          const pct = Math.round((stat.published / maxPublished) * 100);
          return (
            <div key={stat.platform}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="font-medium text-[#f1f0ff]">{meta.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#a09ec0]">
                  <span>{stat.published} published</span>
                  {stat.failed > 0 && (
                    <span className="text-red-400">{stat.failed} failed</span>
                  )}
                  <span
                    className={`font-semibold ${
                      stat.successRate >= 90
                        ? "text-[#22c55e]"
                        : stat.successRate >= 70
                          ? "text-[#f59e0b]"
                          : "text-red-400"
                    }`}
                  >
                    {stat.successRate}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2e2e3e]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: meta.color + "99" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
