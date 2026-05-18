import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/server/services/NotificationService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new NotificationService();

export async function PATCH(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    await service.markAllRead();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
