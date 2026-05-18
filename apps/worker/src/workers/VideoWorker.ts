import { Worker, type Job } from "bullmq";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { redisConnection } from "../queues/connection";

type VideoJob = { articleId: string };

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  return true;
}

export function createVideoWorker(concurrency: number) {
  if (!configureCloudinary()) {
    console.warn("[VideoWorker] Cloudinary not configured — worker disabled");
    return null;
  }

  return new Worker<VideoJob>(
    QUEUE_NAMES.VIDEO,
    async (job: Job<VideoJob>) => {
      const { articleId } = job.data;

      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { title: true, thumbnailUrl: true, thumbnailPath: true },
      });
      if (!article) throw new Error(`Article ${articleId} not found`);

      await prisma.articleVideo.upsert({
        where: { articleId },
        create: { articleId, status: "PROCESSING" },
        update: { status: "PROCESSING", error: null },
      });

      try {
        const imageSource = article.thumbnailPath ?? article.thumbnailUrl;
        if (!imageSource) throw new Error("No thumbnail available for video generation");

        // Upload source image if it's an external URL (not already on Cloudinary)
        let publicId: string;
        if (article.thumbnailPath) {
          // Already on Cloudinary — extract public_id
          publicId = article.thumbnailPath.replace(/^.*\/upload\/(?:v\d+\/)?/, "").replace(/\.[^.]+$/, "");
        } else {
          const upload = await cloudinary.uploader.upload(imageSource, {
            folder: "gamepulse/video-sources",
            resource_type: "image",
          });
          publicId = upload.public_id;
        }

        // Build a 9-second slideshow video: image + title overlay + fade in/out
        const sanitizedTitle = article.title.slice(0, 80).replace(/['"]/g, "");
        const videoUrl = cloudinary.url(publicId, {
          resource_type: "video",
          transformation: [
            // Duration & size for TikTok/Reels (9:16)
            { width: 1080, height: 1920, crop: "fill", gravity: "center" },
            { duration: "9" },
            // Dark overlay for text legibility
            {
              overlay: { color: "#000000" },
              width: 1080,
              height: 1920,
              opacity: 45,
              effect: "colorize",
            },
            // Title text
            {
              overlay: {
                font_family: "Arial",
                font_size: 52,
                font_weight: "bold",
                text: sanitizedTitle,
                text_align: "center",
              },
              color: "#ffffff",
              width: 900,
              crop: "fit",
              gravity: "center",
              y: 100,
            },
            // GamePulse branding
            {
              overlay: {
                font_family: "Arial",
                font_size: 32,
                text: "GamePulse Hub",
              },
              color: "#a09ec0",
              gravity: "south",
              y: 80,
            },
            // Fade in + fade out
            { effect: "fade:500" },
            { effect: "fade:-1000" },
          ],
          sign_url: false,
        });

        await prisma.articleVideo.update({
          where: { articleId },
          data: { status: "READY", videoUrl, publicId, duration: 9 },
        });

        console.log(`[VideoWorker] Generated video for article ${articleId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await prisma.articleVideo.update({
          where: { articleId },
          data: { status: "FAILED", error: message },
        });
        throw error;
      }
    },
    { connection: redisConnection, concurrency },
  );
}
