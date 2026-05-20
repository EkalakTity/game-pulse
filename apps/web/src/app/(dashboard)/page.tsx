import { prisma } from "@gamepulse/database";
import { Newspaper, Rss, Share2, CheckCircle } from "lucide-react";
import { TrendingWidget } from "@/components/dashboard/TrendingWidget";
import { TrendingService } from "@/server/services/TrendingService";

const trendingService = new TrendingService();

async function getDashboardStats() {
  const [totalArticles, activeSources, scheduledPosts, publishedToday] = await Promise.all([
    prisma.article.count(),
    prisma.feedSource.count({ where: { status: "ACTIVE" } }),
    prisma.socialPost.count({ where: { status: "SCHEDULED" } }),
    prisma.socialPost.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);
  return { totalArticles, activeSources, scheduledPosts, publishedToday };
}

async function getRecentActivity() {
  return prisma.jobLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      jobType: true,
      result: true,
      message: true,
      durationMs: true,
      createdAt: true,
    },
  });
}

export default async function DashboardPage() {
  const [stats, activity, trending] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(),
    trendingService.getTopTrending(8),
  ]);

  const statCards = [
    { label: "Total Articles", value: stats.totalArticles, icon: Newspaper, color: "text-[#8b5cf6]" },
    { label: "Active Sources", value: stats.activeSources, icon: Rss, color: "text-[#22c55e]" },
    { label: "Scheduled Posts", value: stats.scheduledPosts, icon: Share2, color: "text-[#3b82f6]" },
    { label: "Published Today", value: stats.publishedToday, icon: CheckCircle, color: "text-[#f59e0b]" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#a09ec0]">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <p className="mt-2 text-3xl font-bold">{value.toLocaleString("en-US")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendingWidget trending={trending} />

        <div className="rounded-lg border border-[#2e2e3e] bg-[#18181f] p-5">
          <h2 className="mb-4 text-base font-semibold">Recent Activity</h2>
          <div className="space-y-2">
            {activity.length === 0 && (
              <p className="text-sm text-[#6b6988]">No activity yet.</p>
            )}
            {activity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-[#222230]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      log.result === "SUCCESS"
                        ? "text-[#22c55e]"
                        : log.result === "FAILURE"
                          ? "text-[#ef4444]"
                          : "text-[#f59e0b]"
                    }
                  >
                    {log.result === "SUCCESS" ? "✓" : log.result === "FAILURE" ? "✗" : "~"}
                  </span>
                  <span className="text-[#a09ec0]">{log.jobType.replace("_", " ")}</span>
                  {log.message && (
                    <span className="truncate text-[#6b6988]">{log.message}</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[#6b6988]">
                  {new Date(log.createdAt).toLocaleTimeString("en-GB", { timeZone: "UTC", hour12: false })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
