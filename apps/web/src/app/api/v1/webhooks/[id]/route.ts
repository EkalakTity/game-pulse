import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { WebhookService } from "@/server/services/WebhookService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new WebhookService();

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    const body = updateSchema.parse(await req.json());
    return NextResponse.json(await service.update(params.id, body));
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
