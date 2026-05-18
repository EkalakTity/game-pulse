import cron from "node-cron";
import { prisma } from "@gamepulse/database";
import { ingestQueue } from "../queues/definitions";
import { runTokenExpiryCheck } from "../jobs/TokenExpiryCheck";

export class CronScheduler {
  private tasks: cron.ScheduledTask[] = [];

  start(): void {
    // Feed ingestion check — every 5 minutes, enqueue sources due for refresh
    const feedTask = cron.schedule("*/5 * * * *", async () => {
      await this.enqueueDueFeeds();
    });

    // Token expiry check — daily at 09:00
    const tokenTask = cron.schedule("0 9 * * *", async () => {
      await runTokenExpiryCheck();
    });

    this.tasks.push(feedTask, tokenTask);
    console.log("CronScheduler started");
  }

  stop(): void {
    this.tasks.forEach((t) => t.stop());
    this.tasks = [];
  }

  private async enqueueDueFeeds(): Promise<void> {
    const sources = await prisma.feedSource.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { lastFetchedAt: null },
          {
            lastFetchedAt: {
              lte: new Date(Date.now() - 60 * 1000),
            },
          },
        ],
      },
      select: { id: true, fetchIntervalMin: true, lastFetchedAt: true },
    });

    const due = sources.filter((s) => {
      if (!s.lastFetchedAt) return true;
      const intervalMs = s.fetchIntervalMin * 60 * 1000;
      return Date.now() - s.lastFetchedAt.getTime() >= intervalMs;
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
