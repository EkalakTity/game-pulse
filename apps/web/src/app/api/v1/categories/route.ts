import { NextRequest, NextResponse } from "next/server";
import { createCategorySchema } from "@/server/validators/category.schema";
import { CategoryService } from "@/server/services/CategoryService";
import { CategoryRepository } from "@/server/repositories/CategoryRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const categoryService = new CategoryService(new CategoryRepository());

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const categories = await categoryService.listCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const input = createCategorySchema.parse(body);
    const result = await categoryService.createCategory(input);

    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
