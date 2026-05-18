import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiKeyService } from "@/server/services/ApiKeyService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new ApiKeyService();

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    return NextResponse.json(await service.list());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    const { name } = z.object({ name: z.string().min(1).max(100) }).parse(await req.json());
    const result = await service.create(name);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
