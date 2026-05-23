import { NextRequest, NextResponse } from "next/server";
import { FeedService } from "@/server/services/FeedService";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { getIngestQueue } from "@/lib/queue/client";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const feedService = new FeedService(new FeedRepository());

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const feedResult = await feedService.getFeed(params.id);
    if (!feedResult.success) return handleApiError(feedResult.error);

    // Reset ERROR feeds to ACTIVE so the badge reflects the retry immediately
    if (feedResult.data.status === "ERROR") {
      await feedService.updateFeed(params.id, { status: "ACTIVE" });
    }

    const queue = getIngestQueue();
    const job = await queue.add(
      "FETCH_FEED",
      { feedSourceId: params.id },
      { jobId: `manual-ingest-${params.id}-${Date.now()}` },
    );

    return NextResponse.json({ success: true, data: { jobId: job.id } });
  } catch (error) {
    return handleApiError(error);
  }
}
