import { NextRequest, NextResponse } from "next/server";
import { updateArticleSchema } from "@/server/validators/article.schema";
import { ArticleService } from "@/server/services/ArticleService";
import { ArticleRepository } from "@/server/repositories/ArticleRepository";
import { handleApiError } from "@/server/middleware/errorHandler";

const articleService = new ArticleService(new ArticleRepository());

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const result = await articleService.getArticle(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const input = updateArticleSchema.parse(body);

    if (input.status) {
      const result = await articleService.updateStatus(params.id, input.status);
      if (!result.success) return handleApiError(result.error);
    }

    if (input.categoryIds) {
      const result = await articleService.updateCategories(params.id, input.categoryIds);
      if (!result.success) return handleApiError(result.error);
    }

    const article = await articleService.getArticle(params.id);
    if (!article.success) return handleApiError(article.error);

    return NextResponse.json({ success: true, data: article.data });
  } catch (error) {
    return handleApiError(error);
  }
}
