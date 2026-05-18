import { Worker, type Job } from "bullmq";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { ThumbnailExtractor } from "../processors/ThumbnailExtractor";
import { redisConnection } from "../queues/connection";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key:    process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure:     true,
});

type MediaJob = {
  articleId: string;
  imageUrl?: string;
};

const extractor = new ThumbnailExtractor();

async function uploadFromUrl(imageUrl: string, articleId: string) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "gamepulse/thumbnails",
    resource_type: "image",
    transformation: [{ width: 1200, height: 630, crop: "limit" }],
  });

  await prisma.media.create({
    data: {
      filename: result.original_filename ?? result.public_id,
      originalUrl: imageUrl,
      storedUrl: result.secure_url,
      storedPath: result.public_id,
      mimeType: `image/${result.format}`,
      size: result.bytes,
      width: result.width,
      height: result.height,
      type: "THUMBNAIL",
      articleId,
    },
  });

  await prisma.article.update({
    where: { id: articleId },
    data: { thumbnailUrl: result.secure_url },
  });
}

async function tryFallbackSourceLogo(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { source: { select: { logoUrl: true } } },
  });
  if (article?.source.logoUrl) {
    await prisma.article.update({
      where: { id: articleId },
      data: { thumbnailUrl: article.source.logoUrl },
    });
  }
}

export function createMediaWorker(concurrency: number) {
  return new Worker<MediaJob>(
    QUEUE_NAMES.MEDIA,
    async (job: Job<MediaJob>) => {
      const { articleId, imageUrl } = job.data;
      const start = Date.now();

      try {
        let resolvedUrl = imageUrl ?? null;

        if (!resolvedUrl) {
          const article = await prisma.article.findUnique({
            where: { id: articleId },
            select: { url: true },
          });
          if (article) {
            resolvedUrl = await extractor.extract(article.url);
          }
        }

        if (resolvedUrl) {
          await uploadFromUrl(resolvedUrl, articleId);
        } else {
          await tryFallbackSourceLogo(articleId);
        }

        await prisma.jobLog.create({
          data: {
            jobType: "MEDIA_DOWNLOAD",
            jobId: job.id,
            result: "SUCCESS",
            durationMs: Date.now() - start,
            metadata: { articleId, resolvedUrl },
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await prisma.jobLog.create({
          data: {
            jobType: "MEDIA_DOWNLOAD",
            jobId: job.id,
            result: "FAILURE",
            message,
            durationMs: Date.now() - start,
            metadata: { articleId },
          },
        });

        throw error;
      }
    },
    { connection: redisConnection, concurrency },
  );
}
