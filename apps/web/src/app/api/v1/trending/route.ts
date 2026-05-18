import { NextRequest, NextResponse } from "next/server";
import { TrendingService } from "@/server/services/TrendingService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const trendingService = new TrendingService();

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "8", 10),
      20,
    );
    const [trending, alerts] = await Promise.all([
      trendingService.getTopTrending(limit),
      trendingService.getSurgeAlerts(),
    ]);

    return NextResponse.json({
      success: true,
      data: { trending, surgeCount: alerts.length },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
