import { NextRequest, NextResponse } from "next/server";
import { ArticleService } from "@/server/services/ArticleService";
import { ArticleRepository } from "@/server/repositories/ArticleRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const articleService = new ArticleService(new ArticleRepository());

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await articleService.processAi(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}
