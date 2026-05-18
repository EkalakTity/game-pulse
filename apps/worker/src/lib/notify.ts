import { prisma, Prisma } from "@gamepulse/database";
import type { NotificationType } from "@gamepulse/database";
import { sendCriticalEmail } from "./email";

type NotifyOptions = {
  email?: { subject: string; html: string };
};

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>,
  opts?: NotifyOptions,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { type, title, message, data: data as Prisma.InputJsonValue ?? Prisma.JsonNull },
    });
  } catch (err) {
    console.error("[notify] Failed to create notification:", err);
  }

  if (opts?.email) {
    await sendCriticalEmail(opts.email);
  }
}

/** Returns true if a notification of this type with the given dedupKey was created in the last 24 h */
export async function notificationExistsRecent(
  type: NotificationType,
  dedupKey: string,
): Promise<boolean> {
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
