import { NextRequest, NextResponse } from "next/server";
import { GameService } from "@/server/services/GameService";
import { GameRepository } from "@/server/repositories/GameRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const gameService = new GameService(new GameRepository());

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;
  try {
    const result = await gameService.removeGame(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
