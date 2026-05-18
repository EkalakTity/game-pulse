import { prisma, Prisma, type NotificationType, type Notification } from "@gamepulse/database";

export type { Notification };

type CreateInput = {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

export class NotificationService {
  async create(input: CreateInput): Promise<Notification> {
    return prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data as Prisma.InputJsonValue ?? Prisma.JsonNull,
      },
    });
  }

  async listRecent(limit = 30): Promise<Notification[]> {
    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async countUnread(): Promise<number> {
    return prisma.notification.count({ where: { isRead: false } });
  }

  async markRead(id: string): Promise<void> {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(): Promise<void> {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  }

  /** Dedup guard: true if a notification of this type exists for the given dedup key in the last 24 h */
  async existsRecent(type: NotificationType, dedupKey: string): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.notification.count({
      where: {
        type,
        createdAt: { gte: since },
        data: { path: ["dedupKey"], equals: dedupKey },
      },
    });
    return count > 0;
  }
}
