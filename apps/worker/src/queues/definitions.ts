import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@gamepulse/config";
import { redisConnection } from "./connection";

export const ingestQueue = new Queue(QUEUE_NAMES.INGEST, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: { count: 200 },
  },
});

export const publishQueue = new Queue(QUEUE_NAMES.PUBLISH, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export const scheduleQueue = new Queue(QUEUE_NAMES.SCHEDULE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
  },
});

export const mediaQueue = new Queue(QUEUE_NAMES.MEDIA, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

export const aiQueue = new Queue(QUEUE_NAMES.AI_PROCESS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 15000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

export const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

export const translateQueue = new Queue(QUEUE_NAMES.TRANSLATE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

export const videoQueue = new Queue(QUEUE_NAMES.VIDEO, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 15000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const commentQueue = new Queue(QUEUE_NAMES.COMMENT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});
