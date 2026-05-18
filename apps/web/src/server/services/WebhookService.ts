import crypto from "crypto";
import { prisma, type Webhook } from "@gamepulse/database";

export type { Webhook };

export type WebhookEvent =
  | "article.ingested"
  | "article.published"
  | "post.published"
  | "post.failed"
  | "token.expired";

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  "article.ingested",
  "article.published",
  "post.published",
  "post.failed",
  "token.expired",
];

function generateSecret(): string {
  return "whsec_" + crypto.randomBytes(24).toString("hex");
}

export class WebhookService {
  async list(): Promise<Webhook[]> {
    return prisma.webhook.findMany({ orderBy: { createdAt: "desc" } });
  }

  async getById(id: string): Promise<Webhook | null> {
    return prisma.webhook.findUnique({ where: { id } });
  }

  async create(input: { name: string; url: string; events: string[] }): Promise<Webhook> {
    return prisma.webhook.create({
      data: { name: input.name, url: input.url, events: input.events, secret: generateSecret() },
    });
  }

  async update(
    id: string,
    input: { name?: string; url?: string; events?: string[]; isActive?: boolean },
  ): Promise<Webhook> {
    return prisma.webhook.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.webhook.delete({ where: { id } });
  }

  async rotateSecret(id: string): Promise<Webhook> {
    return prisma.webhook.update({ where: { id }, data: { secret: generateSecret() } });
  }

  async getDeliveries(webhookId: string, limit = 20) {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /** Enqueue delivery jobs for all active webhooks subscribed to this event */
  async dispatch(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    const hooks = await prisma.webhook.findMany({
      where: { isActive: true, events: { has: event } },
    });
    if (hooks.length === 0) return;

    const { getWebhookQueue } = await import("../../lib/queues");
    const webhookQueue = getWebhookQueue();
    await Promise.all(
      hooks.map((hook) =>
        webhookQueue.add(
          "DELIVER_WEBHOOK",
          { webhookId: hook.id, event, payload },
          { attempts: 5, backoff: { type: "exponential", delay: 5000 } },
        ),
      ),
    );
  }
}
