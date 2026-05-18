import { prismaRead as prisma } from "@gamepulse/database";

export type TrendingCategory = {
  id: string;
  name: string;
  color: string;
  slug: string;
  articleCount24h: number;
  articleCount7d: number;
  postCount24h: number;
  postCount7d: number;
  trendScore: number;
  isSurging: boolean;
  changeVsBaseline: number;
};

// Weights: a social post signals more intent than just an ingest
const ARTICLE_WEIGHT = 1.0;
const POST_WEIGHT = 2.0;
const SURGE_THRESHOLD = 2.0;

type RawRow = {
  id: string;
  name: string;
  color: string;
  slug: string;
  articles_24h: bigint;
  articles_7d: bigint;
  posts_24h: bigint;
  posts_7d: bigint;
  articles_prev_6d: bigint;
  posts_prev_6d: bigint;
};

export class TrendingService {
  async getTopTrending(limit = 8): Promise<TrendingCategory[]> {
    const rows = await prisma.$queryRaw<RawRow[]>`
      SELECT
        c.id,
        c.name,
        c.color,
        c.slug,
        COUNT(DISTINCT CASE WHEN a.created_at >= NOW() - INTERVAL '24 hours'
              THEN a.id END)::bigint                                   AS articles_24h,
        COUNT(DISTINCT CASE WHEN a.created_at >= NOW() - INTERVAL '7 days'
              THEN a.id END)::bigint                                   AS articles_7d,
        COUNT(DISTINCT CASE WHEN sp.created_at >= NOW() - INTERVAL '24 hours'
              THEN sp.id END)::bigint                                  AS posts_24h,
        COUNT(DISTINCT CASE WHEN sp.created_at >= NOW() - INTERVAL '7 days'
              THEN sp.id END)::bigint                                  AS posts_7d,
        COUNT(DISTINCT CASE
              WHEN a.created_at >= NOW() - INTERVAL '7 days'
               AND a.created_at <  NOW() - INTERVAL '24 hours'
              THEN a.id END)::bigint                                   AS articles_prev_6d,
        COUNT(DISTINCT CASE
              WHEN sp.created_at >= NOW() - INTERVAL '7 days'
               AND sp.created_at <  NOW() - INTERVAL '24 hours'
              THEN sp.id END)::bigint                                  AS posts_prev_6d
      FROM categories c
      LEFT JOIN article_categories ac ON ac.category_id = c.id
      LEFT JOIN articles          a  ON a.id = ac.article_id
      LEFT JOIN social_posts      sp ON sp.article_id = a.id
      GROUP BY c.id, c.name, c.color, c.slug
    `;

    const scored = rows.map((r) => {
      const a24 = Number(r.articles_24h);
      const p24 = Number(r.posts_24h);
      const a7 = Number(r.articles_7d);
      const p7 = Number(r.posts_7d);
      const aPrev = Number(r.articles_prev_6d);
      const pPrev = Number(r.posts_prev_6d);

      const trendScore = a24 * ARTICLE_WEIGHT + p24 * POST_WEIGHT;

      // Daily average of the preceding 6-day window
      const dailyBaseline = (aPrev * ARTICLE_WEIGHT + pPrev * POST_WEIGHT) / 6;
      const isSurging = dailyBaseline > 0 && trendScore >= dailyBaseline * SURGE_THRESHOLD;
      const changeVsBaseline = dailyBaseline > 0
        ? Math.round((trendScore / dailyBaseline - 1) * 100)
        : 0;

      return {
        id: r.id,
        name: r.name,
        color: r.color,
        slug: r.slug,
        articleCount24h: a24,
        articleCount7d: a7,
        postCount24h: p24,
        postCount7d: p7,
        trendScore,
        isSurging,
        changeVsBaseline,
      };
    });

    // Sort by trend score descending, take top N
    return scored
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  }

  async getSurgeAlerts(): Promise<TrendingCategory[]> {
    const all = await this.getTopTrending(50);
    return all.filter((c) => c.isSurging);
  }
}
