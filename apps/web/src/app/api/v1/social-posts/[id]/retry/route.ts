import { NextRequest, NextResponse } from "next/server";
import { SocialPostService } from "@/server/services/SocialPostService";
import { SocialPostRepository } from "@/server/repositories/SocialPostRepository";
import { SocialAccountRepository } from "@/server/repositories/SocialAccountRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";
import { getPublishQueue } from "@/lib/queue/client";

const service = new SocialPostService(new SocialPostRepository(), new SocialAccountRepository());

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await service.retryPost(params.id);
    if (!result.success) return handleApiError(result.error);

    try {
      await getPublishQueue().add("PUBLISH_POST", { socialPostId: result.data.id }, {
        jobId: `publish-${result.data.id}`,
      });
    } catch (queueErr) {
      console.error("[retry] Failed to enqueue publish job — recovery cron will retry:", queueErr);
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}
