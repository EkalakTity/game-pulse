import { Worker, type Job } from "bullmq";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { redisConnection } from "../queues/connection";
import { publishQueue } from "../queues/definitions";

type ScheduleCheckJob = Record<string, never>;

export function createScheduleWorker() {
  return new Worker<ScheduleCheckJob>(
    QUEUE_NAMES.SCHEDULE,
    async (_job: Job<ScheduleCheckJob>) => {
      const duePosts = await prisma.socialPost.findMany({
        where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
        select: { id: true },
      });

      for (const post of duePosts) {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: "QUEUED" },
        });
        await publishQueue.add("PUBLISH_POST", { socialPostId: post.id });
      }
    },
    { connection: redisConnection, concurrency: 1 },
  );
}
