import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TenantService } from "@/server/services/TenantService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new TenantService();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
});

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
    const body = createSchema.parse(await req.json());
    return NextResponse.json(await service.create(body), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
