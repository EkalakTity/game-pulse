import { NextRequest, NextResponse } from "next/server";
import { TrendingService } from "@/server/services/TrendingService";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withApiKey } from "@/lib/auth/apiKeyMiddleware";

const service = new TrendingService();

export async function GET(req: NextRequest) {
  const authError = await withApiKey(req);
  if (authError) return authError;
  try {
    const trending = await service.getTopTrending(10);
    return NextResponse.json({ trending });
  } catch (error) {
    return handleApiError(error);
  }
}
