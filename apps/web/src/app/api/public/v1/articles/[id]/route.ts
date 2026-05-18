import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@gamepulse/database";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withApiKey } from "@/lib/auth/apiKeyMiddleware";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withApiKey(req);
  if (authError) return authError;

  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id, status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        url: true,
        author: true,
        publishedAt: true,
        thumbnailUrl: true,
        aiCaption: true,
        aiHashtags: true,
        source: { select: { name: true, url: true } },
        categories: { select: { category: { select: { name: true, slug: true } } } },
        translations: { select: { locale: true, title: true, summary: true, hashtags: true } },
      },
    });

    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch (error) {
    return handleApiError(error);
  }
}
