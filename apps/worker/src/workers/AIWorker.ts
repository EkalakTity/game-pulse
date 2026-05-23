import { Worker } from "bullmq";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES, JOB_TYPES } from "@gamepulse/config";
import { redisConnection } from "../queues/connection";
import { AIProcessor } from "../processors/AIProcessor";
import type { Prisma } from "@gamepulse/database";

type ProcessAIJobData = {
  articleId: string;
};

export function createAIWorker(concurrency = 2) {
  let processor: AIProcessor | null = null;

  try {
    processor = new AIProcessor();
  } catch (err) {
    console.warn("[AIWorker] ANTHROPIC_API_KEY not set — AI worker disabled");
    return null;
  }

  const aiProcessor = processor;

  return new Worker<ProcessAIJobData>(
    QUEUE_NAMES.AI_PROCESS,
    async (job) => {
      if (job.name !== JOB_TYPES.PROCESS_AI) return;

      const { articleId } = job.data;
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          title: true,
          summary: true,
          publishedAt: true,
          source: { select: { gameTags: true } },
        },
      });

      if (!article) {
        throw new Error(`Article ${articleId} not found`);
      }

      const result = await aiProcessor.processArticle({
        title: article.title,
        summary: article.summary,
        gameTags: article.source.gameTags,
        publishedAt: article.publishedAt,
      });

      await prisma.article.update({
        where: { id: articleId },
        data: {
          aiSummary: result.summary,
          aiScore: result.score,
          aiScoreReason: result.scoreReason,
          aiCaption: result.captions as Prisma.InputJsonValue,
          aiHashtags: result.hashtags,
          aiProcessedAt: new Date(),
        },
      });

      console.log(`[AIWorker] Processed article ${articleId} — score: ${result.score}`);
    },
    {
      connection: redisConnection,
      concurrency,
    },
  );
}
