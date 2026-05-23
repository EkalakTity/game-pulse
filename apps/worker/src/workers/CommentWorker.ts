import { Worker, type Job } from "bullmq";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { redisConnection } from "../queues/connection";
import { FacebookAdapter } from "../adapters/FacebookAdapter";
import { InstagramAdapter } from "../adapters/InstagramAdapter";
import { TikTokAdapter } from "../adapters/TikTokAdapter";
import { LineOAAdapter } from "../adapters/LineOAAdapter";

type CommentJob = { socialPostId: string };

type CommentAdapter = {
  postComment(postId: string, text: string, token: string): Promise<{ commentId: string }>;
};

function decryptToken(ciphertext: string): string {
  const { createDecipheriv } = require("crypto") as typeof import("crypto");
  const key = process.env["TOKEN_ENCRYPTION_KEY"];
  if (!key || key.length !== 64) throw new Error("TOKEN_ENCRYPTION_KEY missing");
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");
  const [ivB64, authTagB64, dataB64] = parts as [string, string, string];
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  return decipher.update(Buffer.from(dataB64, "base64")).toString("utf8") + decipher.final("utf8");
}

const adapters: Record<string, CommentAdapter> = {
  FACEBOOK: new FacebookAdapter(),
  INSTAGRAM: new InstagramAdapter(),
  TIKTOK: new TikTokAdapter(),
  LINE_OA: new LineOAAdapter(),
};

export function createCommentWorker(concurrency: number = 3) {
  return new Worker<CommentJob>(
    QUEUE_NAMES.COMMENT,
    async (job: Job<CommentJob>) => {
      const { socialPostId } = job.data;

      const post = await prisma.socialPost.findUnique({
        where: { id: socialPostId },
        include: { account: true },
      });

      if (!post) throw new Error(`Social post ${socialPostId} not found`);
      if (!post.adComment) throw new Error(`Social post ${socialPostId} has no adComment set`);
      if (!post.externalPostId) throw new Error(`Social post ${socialPostId} has no externalPostId — not yet published`);

      try {
        const accessToken = decryptToken(post.account.accessToken);
        const adapter = adapters[post.account.platform];
        if (!adapter) throw new Error(`No adapter for platform ${post.account.platform}`);

        const result = await adapter.postComment(
          post.externalPostId,
          post.adComment,
          accessToken,
        );

        await prisma.socialPost.update({
          where: { id: socialPostId },
          data: {
            adCommentStatus: "POSTED",
            adCommentPostedAt: new Date(),
            adCommentId: result.commentId,
            adCommentError: null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await prisma.socialPost.update({
          where: { id: socialPostId },
          data: {
            adCommentStatus: "FAILED",
            adCommentError: message,
          },
        });

        throw error;
      }
    },
    { connection: redisConnection, concurrency },
  );
}
