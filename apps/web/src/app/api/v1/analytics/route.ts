import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/AnalyticsService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const analyticsService = new AnalyticsService();

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const summary = await analyticsService.getSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
