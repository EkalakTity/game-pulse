import { Worker, type Job } from "bullmq";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { redisConnection } from "../queues/connection";
import { FacebookAdapter } from "../adapters/FacebookAdapter";
import { InstagramAdapter } from "../adapters/InstagramAdapter";
import { TikTokAdapter } from "../adapters/TikTokAdapter";
import { LineOAAdapter } from "../adapters/LineOAAdapter";
import { createNotification } from "../lib/notify";
import { buildJobFailedEmail } from "../lib/email";

type PublishJob = { socialPostId: string };

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

const adapters = {
  FACEBOOK: new FacebookAdapter(),
  INSTAGRAM: new InstagramAdapter(),
  TIKTOK: new TikTokAdapter(),
  LINE_OA: new LineOAAdapter(),
};

export function createPublishWorker(concurrency: number) {
  return new Worker<PublishJob>(
    QUEUE_NAMES.PUBLISH,
    async (job: Job<PublishJob>) => {
      const start = Date.now();
      const { socialPostId } = job.data;

      const post = await prisma.socialPost.findUnique({
        where: { id: socialPostId },
        include: { account: true },
      });

      if (!post) throw new Error(`Social post ${socialPostId} not found`);
      if (post.status === "CANCELLED" || post.status === "PUBLISHED") return;

      await prisma.socialPost.update({ where: { id: socialPostId }, data: { status: "QUEUED" } });

      try {
        const accessToken = decryptToken(post.account.accessToken);
        const adapter = adapters[post.account.platform];

        const result = await adapter.publish(
          post.caption ?? "",
          post.hashtags,
          post.mediaUrls,
          post.account.accountId,
          accessToken,
        );

        await prisma.socialPost.update({
          where: { id: socialPostId },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            externalPostId: result.externalPostId,
            failureReason: null,
          },
        });

        await prisma.jobLog.create({
          data: {
            jobType: "SOCIAL_PUBLISH",
            jobId: job.id,
            result: "SUCCESS",
            socialPostId,
            durationMs: Date.now() - start,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await prisma.socialPost.update({
          where: { id: socialPostId },
          data: { status: "FAILED", failureReason: message },
        });

        await prisma.jobLog.create({
          data: {
            jobType: "SOCIAL_PUBLISH",
            jobId: job.id,
            result: "FAILURE",
            socialPostId,
            message,
            durationMs: Date.now() - start,
          },
        });

        await createNotification(
          "JOB_FAILED",
          "Post Failed to Publish",
          `Post to ${post.account.platform} (${post.account.accountName}) failed: ${message}`,
          { socialPostId, platform: post.account.platform, accountName: post.account.accountName },
          { email: buildJobFailedEmail(post.account.platform, post.account.accountName, message) },
        );

        throw error;
      }
    },
    { connection: redisConnection, concurrency },
  );
}
