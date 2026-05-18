import { NextRequest, NextResponse } from "next/server";
import { updateFeedSchema } from "@/server/validators/feed.schema";
import { FeedService } from "@/server/services/FeedService";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const feedService = new FeedService(new FeedRepository());

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await feedService.getFeed(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const input = updateFeedSchema.parse(body);
    const result = await feedService.updateFeed(params.id, input);

    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await feedService.deleteFeed(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: null }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
