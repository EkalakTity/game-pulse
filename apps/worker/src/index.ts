import { env } from "@gamepulse/config";
import { createIngestWorker } from "./workers/IngestWorker";
import { createMediaWorker } from "./workers/MediaWorker";
import { createPublishWorker } from "./workers/PublishWorker";
import { createScheduleWorker } from "./workers/ScheduleWorker";
import { createAIWorker } from "./workers/AIWorker";
import { createWebhookWorker } from "./workers/WebhookWorker";
import { createTranslateWorker } from "./workers/TranslateWorker";
import { createVideoWorker } from "./workers/VideoWorker";
import { createCommentWorker } from "./workers/CommentWorker";
import { CronScheduler } from "./scheduler/CronScheduler";
import { redisConnection } from "./queues/connection";
import { startBullBoard } from "./bullboard";

async function main() {
  console.log("GamePulse Worker starting...");

  startBullBoard();

  const ingestWorker    = createIngestWorker(env.INGEST_WORKER_CONCURRENCY);
  const mediaWorker     = createMediaWorker(parseInt(process.env["MEDIA_WORKER_CONCURRENCY"] ?? "10", 10));
  const publishWorker   = createPublishWorker(env.PUBLISH_WORKER_CONCURRENCY);
  const scheduleWorker  = createScheduleWorker();
  const aiWorker        = createAIWorker(env.AI_WORKER_CONCURRENCY);
  const webhookWorker   = createWebhookWorker(5);
  const translateWorker = createTranslateWorker(2);
  const videoWorker     = createVideoWorker(2);
  const commentWorker   = createCommentWorker(3);
  const scheduler       = new CronScheduler();

  ingestWorker.on("completed", (job) => console.log(`[IngestWorker] Job ${job.id} completed`));
  ingestWorker.on("failed", (job, err) => console.error(`[IngestWorker] Job ${job?.id} failed:`, err.message));

  mediaWorker.on("completed", (job) => console.log(`[MediaWorker] Job ${job.id} completed`));
  mediaWorker.on("failed", (job, err) => console.error(`[MediaWorker] Job ${job?.id} failed:`, err.message));

  publishWorker.on("completed", (job) => console.log(`[PublishWorker] Job ${job.id} completed`));
  publishWorker.on("failed", (job, err) => console.error(`[PublishWorker] Job ${job?.id} failed:`, err.message));

  scheduleWorker.on("completed", (job) => console.log(`[ScheduleWorker] Job ${job.id} completed`));

  webhookWorker.on("completed", (job) => console.log(`[WebhookWorker] Job ${job.id} completed`));
  webhookWorker.on("failed", (job, err) => console.error(`[WebhookWorker] Job ${job?.id} failed:`, err.message));

  if (aiWorker) {
    aiWorker.on("completed", (job) => console.log(`[AIWorker] Job ${job.id} completed`));
    aiWorker.on("failed", (job, err) => console.error(`[AIWorker] Job ${job?.id} failed:`, err.message));
  }

  if (translateWorker) {
    translateWorker.on("completed", (job) => console.log(`[TranslateWorker] Job ${job.id} completed`));
    translateWorker.on("failed", (job, err) => console.error(`[TranslateWorker] Job ${job?.id} failed:`, err.message));
  }

  if (videoWorker) {
    videoWorker.on("completed", (job) => console.log(`[VideoWorker] Job ${job.id} completed`));
    videoWorker.on("failed", (job, err) => console.error(`[VideoWorker] Job ${job?.id} failed:`, err.message));
  }

  commentWorker.on("completed", (job) => console.log(`[CommentWorker] Job ${job.id} completed`));
  commentWorker.on("failed", (job, err) => console.error(`[CommentWorker] Job ${job?.id} failed:`, err.message));

  scheduler.start();

  const shutdown = async () => {
    console.log("Shutting down worker...");
    scheduler.stop();
    await ingestWorker.close();
    await mediaWorker.close();
    await publishWorker.close();
    await scheduleWorker.close();
    await webhookWorker.close();
    if (aiWorker) await aiWorker.close();
    if (translateWorker) await translateWorker.close();
    if (videoWorker) await videoWorker.close();
    await commentWorker.close();
    await redisConnection.quit();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("GamePulse Worker ready");
}

main().catch((err) => {
  console.error("Fatal worker error:", err);
  process.exit(1);
});
