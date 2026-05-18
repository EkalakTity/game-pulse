import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/server/services/WebhookService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new WebhookService();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    return NextResponse.json(await service.rotateSecret(params.id));
  } catch (error) {
    return handleApiError(error);
  }
}
