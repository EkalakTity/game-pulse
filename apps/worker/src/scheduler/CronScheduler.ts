import cron from "node-cron";
import { prisma } from "@gamepulse/database";
import { ingestQueue, scheduleQueue, publishQueue } from "../queues/definitions";
import { runTokenExpiryCheck } from "../jobs/TokenExpiryCheck";

export class CronScheduler {
  private tasks: cron.ScheduledTask[] = [];

  start(): void {
    // Feed ingestion check — every 5 minutes, enqueue sources due for refresh
    const feedTask = cron.schedule("*/5 * * * *", async () => {
      await this.enqueueDueFeeds();
    });

    // Scheduled post check — every minute, trigger ScheduleWorker
    const scheduleTask = cron.schedule("* * * * *", async () => {
      await scheduleQueue.add("CHECK_SCHEDULED", {}, { jobId: `schedule-check-${Date.now()}` });
    });

    // Token expiry check — daily at 09:00
    const tokenTask = cron.schedule("0 9 * * *", async () => {
      await runTokenExpiryCheck();
    });

    // Recovery — every 5 minutes, re-enqueue QUEUED posts that have no active job
    const recoveryTask = cron.schedule("*/5 * * * *", async () => {
      await this.recoverQueuedPosts();
    });

    this.tasks.push(feedTask, scheduleTask, recoveryTask, tokenTask);
    console.log("CronScheduler started");
  }

  stop(): void {
    this.tasks.forEach((t) => t.stop());
    this.tasks = [];
  }

  private async recoverQueuedPosts(): Promise<void> {
    // Find posts that have been QUEUED for more than 2 minutes — they likely missed their queue job
    const staleThreshold = new Date(Date.now() - 2 * 60 * 1000);
    const stuck = await prisma.socialPost.findMany({
      where: { status: "QUEUED", updatedAt: { lte: staleThreshold } },
      select: { id: true },
    });

    for (const post of stuck) {
      // jobId deduplicates — won't add if the job is already waiting/active
      await publishQueue.add("PUBLISH_POST", { socialPostId: post.id }, { jobId: `publish-${post.id}` });
    }

    if (stuck.length > 0) {
      console.log(`[Recovery] Re-enqueued ${stuck.length} stuck QUEUED post(s)`);
    }
  }

  private async enqueueDueFeeds(): Promise<void> {
    const sources = await prisma.feedSource.findMany({
      where: {
        status: { in: ["ACTIVE", "ERROR"] },
        OR: [
          { lastFetchedAt: null, lastErrorAt: null },
          { lastFetchedAt: { lte: new Date(Date.now() - 60 * 1000) } },
          { lastErrorAt: { lte: new Date(Date.now() - 60 * 1000) } },
        ],
      },
      select: { id: true, fetchIntervalMin: true, lastFetchedAt: true, lastErrorAt: true, status: true },
    });

    const now = Date.now();
    const due = sources.filter((s) => {
      // ERROR feeds: use lastErrorAt as the last-attempt timestamp for backoff
      const lastAttempt = s.status === "ERROR"
        ? (s.lastErrorAt ?? s.lastFetchedAt)
        : s.lastFetchedAt;
      if (!lastAttempt) return true;
      const intervalMs = s.fetchIntervalMin * 60 * 1000;
      return now - lastAttempt.getTime() >= intervalMs;
    });

    await Promise.all(
      due.map((s) =>
        ingestQueue.add("FETCH_FEED", { feedSourceId: s.id }, { jobId: `ingest-${s.id}` }),
      ),
    );

    if (due.length > 0) {
      console.log(`Enqueued ${due.length} feed(s) for ingestion`);
    }
  }
}
