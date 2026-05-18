import { BarChart2, CheckCircle, XCircle, Clock, Download, TrendingUp } from "lucide-react";
import { AnalyticsService } from "@/server/services/AnalyticsService";
import { DailyVolumeChart } from "@/components/analytics/DailyVolumeChart";
import { PlatformBreakdown } from "@/components/analytics/PlatformBreakdown";
import { TopArticles } from "@/components/analytics/TopArticles";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

const analyticsService = new AnalyticsService();

export default async function AnalyticsPage() {
  const data = await analyticsService.getSummary();

  const statCards = [
    {
      label: "Total Published",
      value: data.totalPublished,
      icon: CheckCircle,
      color: "text-[#22c55e]",
      bg: "bg-[#22c55e]/10",
    },
    {
      label: "Failed Posts",
      value: data.totalFailed,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Scheduled",
      value: data.totalScheduled,
      icon: Clock,
      color: "text-[#3b82f6]",
      bg: "bg-[#3b82f6]/10",
    },
    {
      label: "Published This Week",
      value: data.publishedThisWeek,
      icon: TrendingUp,
      color: "text-[#8b5cf6]",
      bg: "bg-[#8b5cf6]/10",
    },
  ];

  const hasEngagement = Object.values(data.engagement).some((v) => v > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} className="text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
        <a
          href="/api/v1/analytics/export"
          download
          className="flex items-center gap-2 rounded-md border border-[#2e2e3e] px-3 py-2 text-sm text-[#a09ec0] hover:bg-[#222230] hover:text-[#f1f0ff] transition-colors"
        >
          <Download size={14} />
          Export CSV
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a09ec0]">{label}</span>
              <div className={`rounded-md p-1.5 ${bg}`}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Success rate banner */}
      <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#a09ec0]">Overall Success Rate</span>
          <span
            className={`text-2xl font-bold ${
              data.successRate >= 90
                ? "text-[#22c55e]"
                : data.successRate >= 70
                  ? "text-[#f59e0b]"
                  : data.successRate > 0
                    ? "text-red-400"
                    : "text-[#6b6988]"
            }`}
          >
            {data.successRate > 0 ? `${data.successRate}%` : "—"}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#2e2e3e]">
          <div
            className={`h-full rounded-full transition-all ${
              data.successRate >= 90
                ? "bg-[#22c55e]"
                : data.successRate >= 70
                  ? "bg-[#f59e0b]"
                  : "bg-red-400"
            }`}
            style={{ width: `${data.successRate}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-[#6b6988]">
          {data.totalPublished} published / {data.totalPublished + data.totalFailed} attempted
        </p>
      </div>

      {/* Daily volume chart */}
      <DailyVolumeChart data={data.dailyVolume} />

      {/* Platform + top articles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlatformBreakdown data={data.byPlatform} />
        <TopArticles data={data.topArticles} />
      </div>

      {/* Engagement totals */}
      <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#f1f0ff]">Platform Engagement</h2>
          {!hasEngagement && (
            <span className="rounded-full bg-[#2e2e3e] px-2.5 py-0.5 text-xs text-[#6b6988]">
              Pending API integration
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {(
            [
              ["Likes", data.engagement.likes],
              ["Shares", data.engagement.shares],
              ["Comments", data.engagement.comments],
              ["Reach", data.engagement.reach],
              ["Impressions", data.engagement.impressions],
              ["Clicks", data.engagement.clicks],
            ] as [string, number][]
          ).map(([label, val]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-[#f1f0ff]">
                {val > 0 ? val.toLocaleString() : "—"}
              </p>
              <p className="text-xs text-[#6b6988]">{label}</p>
            </div>
          ))}
        </div>
        {!hasEngagement && (
          <p className="mt-3 text-xs text-[#6b6988]">
            Engagement metrics will populate once platform API keys are configured and the
            analytics worker runs its first snapshot.
          </p>
        )}
      </div>
    </div>
  );
}
