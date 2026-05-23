import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@gamepulse/database";
import { z } from "zod";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";
import { getCommentQueue } from "@/lib/queue/client";

const commentBodySchema = z.object({
  text: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const { text } = commentBodySchema.parse(body);

    const post = await prisma.socialPost.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Post not found" } }, { status: 404 });
    }

    if (post.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Post must be PUBLISHED before posting a comment" } },
        { status: 400 },
      );
    }

    // If text is provided and no existing adComment, save it first
    if (text) {
      await prisma.socialPost.update({
        where: { id: params.id },
        data: { adComment: text },
      });
    } else if (!post.adComment) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "No adComment set on this post. Provide { text } in the request body." } },
        { status: 400 },
      );
    }

    await prisma.socialPost.update({
      where: { id: params.id },
      data: { adCommentStatus: "PENDING" },
    });

    await getCommentQueue().add("POST_COMMENT", { socialPostId: params.id }, {
      jobId: `comment-${params.id}-${Date.now()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
