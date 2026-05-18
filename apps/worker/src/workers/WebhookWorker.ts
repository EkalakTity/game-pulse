import { Worker, type Job } from "bullmq";
import crypto from "crypto";
import axios from "axios";
import { prisma, Prisma } from "@gamepulse/database";
import { QUEUE_NAMES } from "@gamepulse/config";
import { redisConnection } from "../queues/connection";

type WebhookJob = {
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
};

function buildSignature(secret: string, body: string, timestamp: number): string {
  const message = `${timestamp}.${body}`;
  return "sha256=" + crypto.createHmac("sha256", secret).update(message).digest("hex");
}

export function createWebhookWorker(concurrency: number) {
  return new Worker<WebhookJob>(
    QUEUE_NAMES.WEBHOOK,
    async (job: Job<WebhookJob>) => {
      const { webhookId, event, payload } = job.data;

      const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
      if (!webhook || !webhook.isActive) return;

      const body = JSON.stringify({ event, payload, timestamp: Date.now() });
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = buildSignature(webhook.secret, body, timestamp);

      const delivery = await prisma.webhookDelivery.create({
        data: { webhookId, event, payload: payload as Prisma.InputJsonValue, status: "PENDING", attempts: 1 },
      });

      try {
        const response = await axios.post(webhook.url, body, {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
            "X-GamePulse-Event": event,
            "X-GamePulse-Signature": signature,
            "X-GamePulse-Timestamp": String(timestamp),
          },
        });

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "SUCCESS",
            statusCode: response.status,
            response: JSON.stringify(response.data).slice(0, 1000),
          },
        });

        // Reset fail counter on success
        if (webhook.failCount > 0) {
          await prisma.webhook.update({ where: { id: webhookId }, data: { failCount: 0 } });
        }
      } catch (error) {
        const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
        const responseText = axios.isAxiosError(error)
          ? JSON.stringify(error.response?.data ?? error.message).slice(0, 1000)
          : String(error);

        const failCount = webhook.failCount + 1;

        await Promise.all([
          prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: { status: "FAILED", statusCode, response: responseText },
          }),
          prisma.webhook.update({
            where: { id: webhookId },
            // Auto-disable after 10 consecutive failures
            data: { failCount, isActive: failCount < 10 },
          }),
        ]);

        throw error;
      }
    },
    { connection: redisConnection, concurrency },
  );
}
