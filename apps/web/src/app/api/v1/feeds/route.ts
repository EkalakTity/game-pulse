import { NextRequest, NextResponse } from "next/server";
import { feedListSchema, createFeedSchema } from "@/server/validators/feed.schema";
import { FeedService } from "@/server/services/FeedService";
import { FeedRepository } from "@/server/repositories/FeedRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const feedService = new FeedService(new FeedRepository());

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { status, cursor, limit } = feedListSchema.parse(params);
    const page = await feedService.listFeeds(status, cursor, limit);

    return NextResponse.json({
      success: true,
      data: page.items,
      meta: { limit, nextCursor: page.nextCursor, hasMore: page.hasMore },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const input = createFeedSchema.parse(body);
    const result = await feedService.createFeed(input);

    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
