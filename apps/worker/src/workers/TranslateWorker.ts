import { Worker, type Job } from "bullmq";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { redisConnection } from "../queues/connection";

type TranslateJob = { articleId: string; locale: string };

const LOCALE_NAMES: Record<string, string> = {
  th: "Thai",
  ja: "Japanese",
  ko: "Korean",
  zh: "Traditional Chinese",
  id: "Indonesian",
  vi: "Vietnamese",
};

export function createTranslateWorker(concurrency: number) {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    console.warn("[TranslateWorker] ANTHROPIC_API_KEY not set — worker disabled");
    return null;
  }

  const client = new Anthropic({ apiKey });

  return new Worker<TranslateJob>(
    QUEUE_NAMES.TRANSLATE,
    async (job: Job<TranslateJob>) => {
      const { articleId, locale } = job.data;

      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { title: true, summary: true, aiHashtags: true },
      });
      if (!article) throw new Error(`Article ${articleId} not found`);

      const langName = LOCALE_NAMES[locale] ?? locale;

      const stream = client.messages.stream({
        model: "claude-opus-4-7",
        max_tokens: 1024,
        // @ts-expect-error — adaptive thinking available on claude-opus-4-7
        thinking: { type: "adaptive" },
        messages: [
          {
            role: "user",
            content: `Translate the following gaming article content to ${langName}. Return JSON only with keys: title, summary, hashtags (array of strings without #). Keep gaming terms recognizable (e.g. keep game titles in original).

Title: ${article.title}
Summary: ${article.summary ?? ""}
Hashtags: ${article.aiHashtags.join(", ")}

JSON:`,
          },
        ],
      });

      const response = await stream.finalMessage();
      const text = response.content.find((b) => b.type === "text")?.text ?? "";

      let parsed: { title: string; summary: string; hashtags: string[] };
      try {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match?.[0] ?? text);
      } catch {
        throw new Error("Failed to parse translation response");
      }

      await prisma.articleTranslation.upsert({
        where: { articleId_locale: { articleId, locale } },
        create: {
          articleId,
          locale,
          title: parsed.title,
          summary: parsed.summary,
          hashtags: parsed.hashtags ?? [],
        },
        update: {
          title: parsed.title,
          summary: parsed.summary,
          hashtags: parsed.hashtags ?? [],
        },
      });

      console.log(`[TranslateWorker] Translated article ${articleId} to ${locale}`);
    },
    { connection: redisConnection, concurrency },
  );
}
