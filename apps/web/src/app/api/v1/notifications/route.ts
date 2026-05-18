import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/server/services/NotificationService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new NotificationService();

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10), 100);
    const [notifications, unreadCount] = await Promise.all([
      service.listRecent(limit),
      service.countUnread(),
    ]);
    return NextResponse.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    return handleApiError(error);
  }
}
