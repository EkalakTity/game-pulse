import { NextRequest, NextResponse } from "next/server";
import { updateCategorySchema } from "@/server/validators/category.schema";
import { CategoryService } from "@/server/services/CategoryService";
import { CategoryRepository } from "@/server/repositories/CategoryRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const categoryService = new CategoryService(new CategoryRepository());

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await categoryService.getCategory(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const input = updateCategorySchema.parse(body);
    const result = await categoryService.updateCategory(params.id, input);

    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await categoryService.deleteCategory(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleApiError(error);
  }
}
