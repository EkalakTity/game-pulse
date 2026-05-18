import { Worker, type Job } from "bullmq";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { FeedParser } from "../processors/FeedParser";
import { DuplicateDetector } from "../processors/DuplicateDetector";
import { CategoryClassifier } from "../processors/CategoryClassifier";
import { redisConnection } from "../queues/connection";
import { mediaQueue } from "../queues/definitions";

type FetchFeedJob = { feedSourceId: string };

const feedParser = new FeedParser();
const duplicateDetector = new DuplicateDetector();
const categoryClassifier = new CategoryClassifier();

export function createIngestWorker(concurrency: number) {
  return new Worker<FetchFeedJob>(
    QUEUE_NAMES.INGEST,
    async (job: Job<FetchFeedJob>) => {
      const start = Date.now();
      const { feedSourceId } = job.data;

      const source = await prisma.feedSource.findUnique({ where: { id: feedSourceId } });
      if (!source || source.status !== "ACTIVE") return;

      let newCount = 0;
      let dupCount = 0;

      try {
        const articles = await feedParser.fetch(source.url);

        for (const article of articles) {
          const hash = duplicateDetector.buildHash(article.title, article.url);

          if (await duplicateDetector.isDuplicate(hash)) {
            dupCount++;
            continue;
          }

          const created = await prisma.$transaction(async (tx) => {
            const a = await tx.article.create({
              data: {
                externalId: article.externalId,
                title: article.title,
                summary: article.summary,
                content: article.content,
                url: article.url,
                author: article.author,
                publishedAt: article.publishedAt,
                thumbnailUrl: article.thumbnailUrl,
                contentHash: hash,
                sourceId: feedSourceId,
              },
            });
            await tx.duplicateHash.create({ data: { hash, articleId: a.id } });
            await tx.feedSource.update({
              where: { id: feedSourceId },
              data: { articleCount: { increment: 1 } },
            });
            return a;
          });

          const categoryIds = await categoryClassifier.classify(article.title, article.summary);
          if (categoryIds.length > 0) {
            await categoryClassifier.applyToArticle(created.id, categoryIds);
          }

          if (article.thumbnailUrl) {
            await mediaQueue.add("DOWNLOAD_THUMBNAIL", {
              articleId: created.id,
              imageUrl: article.thumbnailUrl,
            });
          }

          newCount++;
        }

        await prisma.feedSource.update({
          where: { id: feedSourceId },
          data: { lastFetchedAt: new Date(), lastError: null, lastErrorAt: null, status: "ACTIVE" },
        });

        await prisma.jobLog.create({
          data: {
            jobType: "FEED_INGEST",
            jobId: job.id,
            result: "SUCCESS",
            feedSourceId,
            durationMs: Date.now() - start,
            metadata: { newCount, dupCount, totalFetched: newCount + dupCount },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await prisma.feedSource.update({
          where: { id: feedSourceId },
          data: { lastError: message, lastErrorAt: new Date(), status: "ERROR" },
        });

        await prisma.jobLog.create({
          data: {
            jobType: "FEED_INGEST",
            jobId: job.id,
            result: "FAILURE",
            feedSourceId,
            message,
            durationMs: Date.now() - start,
          },
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency,
    },
  );
}
