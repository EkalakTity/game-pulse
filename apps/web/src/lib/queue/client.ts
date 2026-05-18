import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { QUEUE_NAMES } from "@gamepulse/config";

let _redis: Redis | null = null;
let _ingestQueue: Queue | null = null;
let _publishQueue: Queue | null = null;
let _webhookQueue: Queue | null = null;
let _translateQueue: Queue | null = null;
let _videoQueue: Queue | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _redis;
}

export function getIngestQueue(): Queue {
  if (!_ingestQueue) {
    _ingestQueue = new Queue(QUEUE_NAMES.INGEST, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    });
  }
  return _ingestQueue;
}

export function getPublishQueue(): Queue {
  if (!_publishQueue) {
    _publishQueue = new Queue(QUEUE_NAMES.PUBLISH, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 10000 },
      },
    });
  }
  return _publishQueue;
}

export function getWebhookQueue(): Queue {
  if (!_webhookQueue) {
    _webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, { connection: getRedis() });
  }
  return _webhookQueue;
}

export function getTranslateQueue(): Queue {
  if (!_translateQueue) {
    _translateQueue = new Queue(QUEUE_NAMES.TRANSLATE, { connection: getRedis() });
  }
  return _translateQueue;
}

export function getVideoQueue(): Queue {
  if (!_videoQueue) {
    _videoQueue = new Queue(QUEUE_NAMES.VIDEO, { connection: getRedis() });
  }
  return _videoQueue;
}
