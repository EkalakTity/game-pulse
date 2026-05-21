import { NextRequest, NextResponse } from "next/server";
import { addGameSchema } from "@/server/validators/game.schema";
import { GameService } from "@/server/services/GameService";
import { GameRepository } from "@/server/repositories/GameRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const gameService = new GameService(new GameRepository());

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    const games = await gameService.listGames();
    return NextResponse.json({ success: true, data: games });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const { slug } = addGameSchema.parse(body);
    const result = await gameService.addGame(slug);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
