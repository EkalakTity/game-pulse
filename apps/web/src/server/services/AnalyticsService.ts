import { prismaRead, type SocialPlatform } from "@gamepulse/database";

const prisma = prismaRead;

export type DailyStat = {
  date: string; // "YYYY-MM-DD"
  published: number;
  failed: number;
};

export type PlatformStat = {
  platform: SocialPlatform;
  published: number;
  failed: number;
  cancelled: number;
  successRate: number;
};

export type TopArticle = {
  id: string;
  title: string;
  postCount: number;
  publishedCount: number;
};

export type EngagementTotals = {
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  impressions: number;
  clicks: number;
};

export type AnalyticsSummary = {
  totalPublished: number;
  totalFailed: number;
  totalScheduled: number;
  publishedThisWeek: number;
  successRate: number;
  dailyVolume: DailyStat[];
  byPlatform: PlatformStat[];
  topArticles: TopArticle[];
  engagement: EngagementTotals;
};

type RawDailyRow = { day: Date; published: bigint; failed: bigint };
type RawPlatformRow = {
  platform: string;
  published: bigint;
  failed: bigint;
  cancelled: bigint;
};
type RawEngagementRow = {
  likes: bigint;
  shares: bigint;
  comments: bigint;
  reach: bigint;
  impressions: bigint;
  clicks: bigint;
};

export class AnalyticsService {
  async getSummary(): Promise<AnalyticsSummary> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [counts, publishedThisWeek, dailyRows, platformRows, topArticlesRaw, engagementRows] =
      await Promise.all([
        // Overall status counts
        prisma.socialPost.groupBy({
          by: ["status"],
          _count: { id: true },
        }),

        // Published this week
        prisma.socialPost.count({
          where: { status: "PUBLISHED", publishedAt: { gte: weekAgo } },
        }),

        // Daily volume — last 30 days, fill gaps with generate_series
        prisma.$queryRaw<RawDailyRow[]>`
          WITH days AS (
            SELECT generate_series(
              date_trunc('day', NOW() - INTERVAL '29 days'),
              date_trunc('day', NOW()),
              INTERVAL '1 day'
            )::date AS day
          )
          SELECT
            d.day,
            COALESCE(COUNT(DISTINCT CASE WHEN sp.status = 'PUBLISHED' THEN sp.id END), 0)::bigint AS published,
            COALESCE(COUNT(DISTINCT CASE WHEN sp.status = 'FAILED'    THEN sp.id END), 0)::bigint AS failed
          FROM days d
          LEFT JOIN social_posts sp
            ON date_trunc('day', sp.created_at) = d.day
          GROUP BY d.day
          ORDER BY d.day ASC
        `,

        // Per-platform breakdown
        prisma.$queryRaw<RawPlatformRow[]>`
          SELECT
            sa.platform::text,
            COUNT(DISTINCT CASE WHEN sp.status = 'PUBLISHED'  THEN sp.id END)::bigint AS published,
            COUNT(DISTINCT CASE WHEN sp.status = 'FAILED'     THEN sp.id END)::bigint AS failed,
            COUNT(DISTINCT CASE WHEN sp.status = 'CANCELLED'  THEN sp.id END)::bigint AS cancelled
          FROM social_posts sp
          JOIN social_accounts sa ON sa.id = sp.account_id
          GROUP BY sa.platform
          ORDER BY published DESC
        `,

        // Top 10 articles by post count
        prisma.socialPost.groupBy({
          by: ["articleId"],
          where: { articleId: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),

        // Aggregate engagement from analytics snapshots
        prisma.$queryRaw<RawEngagementRow[]>`
          SELECT
            COALESCE(SUM(likes), 0)::bigint       AS likes,
            COALESCE(SUM(shares), 0)::bigint      AS shares,
            COALESCE(SUM(comments), 0)::bigint    AS comments,
            COALESCE(SUM(reach), 0)::bigint       AS reach,
            COALESCE(SUM(impressions), 0)::bigint AS impressions,
            COALESCE(SUM(clicks), 0)::bigint      AS clicks
          FROM social_post_analytics
        `,
      ]);

    // Resolve article titles for top articles
    const articleIds = topArticlesRaw
      .map((r) => r.articleId)
      .filter((id): id is string => id !== null);

    const articleMap = await prisma.article
      .findMany({ where: { id: { in: articleIds } }, select: { id: true, title: true } })
      .then((rows) => new Map(rows.map((r) => [r.id, r.title])));

    // Build counts lookup
    const countByStatus = Object.fromEntries(
      counts.map((c) => [c.status, c._count.id]),
    ) as Record<string, number>;

    const totalPublished = countByStatus["PUBLISHED"] ?? 0;
    const totalFailed = countByStatus["FAILED"] ?? 0;
    const totalScheduled = countByStatus["SCHEDULED"] ?? 0;
    const totalAttempted = totalPublished + totalFailed;
    const successRate = totalAttempted > 0 ? Math.round((totalPublished / totalAttempted) * 100) : 0;

    const dailyVolume: DailyStat[] = dailyRows.map((r) => ({
      date: r.day.toISOString().slice(0, 10),
      published: Number(r.published),
      failed: Number(r.failed),
    }));

    const byPlatform: PlatformStat[] = platformRows.map((r) => {
      const pub = Number(r.published);
      const fail = Number(r.failed);
      const attempted = pub + fail;
      return {
        platform: r.platform as SocialPlatform,
        published: pub,
        failed: fail,
        cancelled: Number(r.cancelled),
        successRate: attempted > 0 ? Math.round((pub / attempted) * 100) : 0,
      };
    });

    const topArticles: TopArticle[] = topArticlesRaw
      .filter((r) => r.articleId !== null)
      .map((r) => ({
        id: r.articleId!,
        title: articleMap.get(r.articleId!) ?? "(Untitled)",
        postCount: r._count.id,
        publishedCount: 0,
      }));

    const eng = engagementRows[0];
    const engagement: EngagementTotals = {
      likes: Number(eng?.likes ?? 0),
      shares: Number(eng?.shares ?? 0),
      comments: Number(eng?.comments ?? 0),
      reach: Number(eng?.reach ?? 0),
      impressions: Number(eng?.impressions ?? 0),
      clicks: Number(eng?.clicks ?? 0),
    };

    return {
      totalPublished,
      totalFailed,
      totalScheduled,
      publishedThisWeek,
      successRate,
      dailyVolume,
      byPlatform,
      topArticles,
      engagement,
    };
  }

  async exportCsv(): Promise<string> {
    const posts = await prisma.socialPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        account: { select: { platform: true, accountName: true } },
        article: { select: { title: true } },
      },
      take: 5000,
    });

    const header = "Date,Platform,Account,Article,Status,Caption\n";
    const rows = posts.map((p) => {
      const date = p.createdAt.toISOString().slice(0, 10);
      const platform = p.account.platform;
      const account = `"${p.account.accountName.replace(/"/g, '""')}"`;
      const article = p.article?.title
        ? `"${p.article.title.slice(0, 80).replace(/"/g, '""')}"`
        : "";
      const caption = p.caption
        ? `"${p.caption.slice(0, 100).replace(/"/g, '""')}"`
        : "";
      return `${date},${platform},${account},${article},${p.status},${caption}`;
    });

    return header + rows.join("\n");
  }
}
