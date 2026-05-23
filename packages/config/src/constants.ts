export const QUEUE_NAMES = {
  INGEST: "ingest-queue",
  PUBLISH: "publish-queue",
  SCHEDULE: "schedule-queue",
  MEDIA: "media-queue",
  AI_PROCESS: "ai-process-queue",
  WEBHOOK: "webhook-queue",
  TRANSLATE: "translate-queue",
  VIDEO: "video-queue",
  COMMENT: "comment-queue",
} as const;

export const JOB_TYPES = {
  FETCH_FEED: "FETCH_FEED",
  DOWNLOAD_THUMBNAIL: "DOWNLOAD_THUMBNAIL",
  PROMOTE_SCHEDULED: "PROMOTE_SCHEDULED",
  PUBLISH_POST: "PUBLISH_POST",
  PROCESS_AI: "PROCESS_AI",
  DELIVER_WEBHOOK: "DELIVER_WEBHOOK",
  TRANSLATE_ARTICLE: "TRANSLATE_ARTICLE",
  GENERATE_VIDEO: "GENERATE_VIDEO",
  POST_COMMENT: "POST_COMMENT",
} as const;

export const SOCIAL_PLATFORM_LIMITS = {
  FACEBOOK: { caption: 63206, hashtags: 30 },
  INSTAGRAM: { caption: 2200, hashtags: 30 },
  TIKTOK: { caption: 2200, hashtags: 20 },
  LINE_OA: { caption: 5000, hashtags: 0 },
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const DEDUP_HASH_VERSION = 1;
