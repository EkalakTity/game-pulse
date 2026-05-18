import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { socialPostListSchema, createSocialPostSchema } from "@/server/validators/socialPost.schema";
import { SocialPostService } from "@/server/services/SocialPostService";
import { SocialPostRepository } from "@/server/repositories/SocialPostRepository";
import { SocialAccountRepository } from "@/server/repositories/SocialAccountRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new SocialPostService(new SocialPostRepository(), new SocialAccountRepository());

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { status, accountId, cursor, limit } = socialPostListSchema.parse(params);
    const page = await service.listPosts({ status, accountId, cursor, limit });
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
    const token = await getToken({ req, secret: process.env["NEXTAUTH_SECRET"] });
    const body = await req.json();
    const input = createSocialPostSchema.parse(body);
    const result = await service.createPost({ ...input, createdById: token!.sub! });
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
