import { NextRequest, NextResponse } from "next/server";
import { articleFiltersSchema } from "@/server/validators/article.schema";
import { ArticleService } from "@/server/services/ArticleService";
import { ArticleRepository } from "@/server/repositories/ArticleRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import type { ApiSuccess } from "@gamepulse/types";

const articleService = new ArticleService(new ArticleRepository());

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const filters = articleFiltersSchema.parse(params);
    const { cursor, limit, ...rest } = filters;

    const page = await articleService.listArticles(rest, cursor, limit);

    return NextResponse.json({
      success: true,
      data: page.items,
      meta: {
        limit,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
      },
    } satisfies ApiSuccess<typeof page.items>);
  } catch (error) {
    return handleApiError(error);
  }
}
