import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/server/services/AnalyticsService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const analyticsService = new AnalyticsService();

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const csv = await analyticsService.exportCsv();
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gamepulse-analytics-${date}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
