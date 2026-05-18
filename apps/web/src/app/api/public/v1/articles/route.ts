import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@gamepulse/database";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withApiKey } from "@/lib/auth/apiKeyMiddleware";

export async function GET(req: NextRequest) {
  const authError = await withApiKey(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const offset = Number(searchParams.get("offset") ?? 0);
    const category = searchParams.get("category");

    const where = {
      status: "PUBLISHED" as const,
      ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          summary: true,
          url: true,
          author: true,
          publishedAt: true,
          thumbnailUrl: true,
          aiHashtags: true,
          source: { select: { name: true } },
          categories: { select: { category: { select: { name: true, slug: true } } } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({ articles, total, limit, offset });
  } catch (error) {
    return handleApiError(error);
  }
}
