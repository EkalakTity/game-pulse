import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { WebhookService } from "@/server/services/WebhookService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new WebhookService();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
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
    const webhook = await service.create(body);
    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
