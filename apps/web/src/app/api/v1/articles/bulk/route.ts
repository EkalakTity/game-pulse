import { NextRequest, NextResponse } from "next/server";
import { bulkArticleSchema } from "@/server/validators/article.schema";
import { ArticleService } from "@/server/services/ArticleService";
import { ArticleRepository } from "@/server/repositories/ArticleRepository";
import { handleApiError } from "@/server/middleware/errorHandler";

const articleService = new ArticleService(new ArticleRepository());

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids, action, payload } = bulkArticleSchema.parse(body);

    if (action === "SCHEDULE") {
      return NextResponse.json(
        { success: false, error: "Scheduling not available yet" },
        { status: 422 },
      );
    }

    const result = await articleService.bulkAction(
      ids,
      action as "ARCHIVE" | "CATEGORIZE",
      payload,
    );

    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}
