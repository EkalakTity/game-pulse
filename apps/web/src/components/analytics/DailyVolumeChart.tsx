import type { DailyStat } from "@/server/services/AnalyticsService";

type Props = { data: DailyStat[] };

export function DailyVolumeChart({ data }: Props) {
  const maxVal = Math.max(...data.map((d) => d.published + d.failed), 1);

  // Show only every 5th label to avoid crowding
  const labelEvery = 5;

  return (
    <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
      <h2 className="mb-4 text-base font-semibold text-[#f1f0ff]">
        Published Posts — Last 30 Days
      </h2>
      <div className="flex h-32 items-end gap-[3px]" aria-label="Daily post volume chart">
        {data.map((d, i) => {
          const totalPct = ((d.published + d.failed) / maxVal) * 100;
          const failPct = maxVal > 0 ? ((d.failed) / maxVal) * 100 : 0;
          const pubPct = totalPct - failPct;
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col-reverse"
              style={{ height: "100%" }}
              title={`${d.date}: ${d.published} published, ${d.failed} failed`}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-[#2e2e3e] px-2 py-1 text-[10px] text-[#f1f0ff] whitespace-nowrap group-hover:block">
                {d.published}
                {d.failed > 0 && <span className="text-red-400"> +{d.failed}f</span>}
              </div>
              {/* Published bar */}
              <div
                className="w-full rounded-t-sm bg-[#6d28d9]/70 transition-all"
                style={{ height: `${pubPct}%`, minHeight: pubPct > 0 ? "2px" : "0" }}
              />
              {/* Failed bar */}
              {failPct > 0 && (
                <div
                  className="w-full bg-red-500/50"
                  style={{ height: `${failPct}%`, minHeight: "2px" }}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* X-axis labels — show every 5th */}
      <div className="mt-1 flex gap-[3px]">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-[9px] text-[#6b6988]">
                {d.date.slice(5)} {/* MM-DD */}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-[#6b6988]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-[#6d28d9]/70" /> Published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-red-500/50" /> Failed
        </span>
      </div>
    </div>
  );
}
