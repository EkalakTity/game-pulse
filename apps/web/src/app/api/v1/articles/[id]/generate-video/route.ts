import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";
import { getVideoQueue } from "@/lib/queue/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const queue = getVideoQueue();
    await queue.add("GENERATE_VIDEO", { articleId: params.id });
    return NextResponse.json({ queued: true });
  } catch (error) {
    return handleApiError(error);
  }
}
