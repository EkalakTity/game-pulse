import { NextRequest, NextResponse } from "next/server";
import { catalogSearchSchema } from "@/server/validators/game.schema";
import { GameService } from "@/server/services/GameService";
import { GameRepository } from "@/server/repositories/GameRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const gameService = new GameService(new GameRepository());

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { q } = catalogSearchSchema.parse(params);
    const games = gameService.searchCatalog(q);
    const generalFeeds = gameService.getGeneralFeeds();
    return NextResponse.json({ success: true, data: { games, generalFeeds } });
  } catch (error) {
    return handleApiError(error);
  }
}
