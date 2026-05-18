import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TenantService } from "@/server/services/TenantService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new TenantService();

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  isActive: z.boolean().optional(),
  settings: z
    .object({
      supportEmail: z.string().email().optional(),
      footerText: z.string().max(200).optional(),
      analyticsId: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    const body = updateSchema.parse(await req.json());
    return NextResponse.json(
      await service.update(params.id, body as Parameters<TenantService["update"]>[1]),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    await service.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
