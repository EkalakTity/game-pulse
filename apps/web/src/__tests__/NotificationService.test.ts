import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../server/services/NotificationService";

vi.mock("@gamepulse/database", () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  Prisma: {
    JsonNull: "JsonNull",
  },
}));

import { prisma } from "@gamepulse/database";

const MOCK_NOTIFICATION = {
  id: "notif-1",
  type: "JOB_FAILED" as const,
  title: "Post Failed",
  message: "Something went wrong",
  data: null,
  isRead: false,
  createdAt: new Date("2026-05-18T10:00:00Z"),
};

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates a notification with required fields", async () => {
      vi.mocked(prisma.notification.create).mockResolvedValueOnce(MOCK_NOTIFICATION as never);

      const result = await service.create({
        type: "JOB_FAILED",
        title: "Post Failed",
        message: "Something went wrong",
      });

      expect(prisma.notification.create).toHaveBeenCalledOnce();
      expect(result.type).toBe("JOB_FAILED");
      expect(result.title).toBe("Post Failed");
    });

    it("passes optional data field when provided", async () => {
      vi.mocked(prisma.notification.create).mockResolvedValueOnce(MOCK_NOTIFICATION as never);

      await service.create({
        type: "JOB_FAILED",
        title: "T",
        message: "M",
        data: { socialPostId: "post-123" },
      });

      const call = vi.mocked(prisma.notification.create).mock.calls[0]![0];
      expect(call.data.data).toBeTruthy();
    });
  });

  describe("listRecent", () => {
    it("returns notifications ordered by createdAt desc (default limit 30)", async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValueOnce([MOCK_NOTIFICATION] as never);

      const result = await service.listRecent();

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" }, take: 30 }),
      );
      expect(result).toHaveLength(1);
    });

    it("respects a custom limit", async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValueOnce([] as never);

      await service.listRecent(5);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe("countUnread", () => {
    it("counts only unread notifications", async () => {
      vi.mocked(prisma.notification.count).mockResolvedValueOnce(3 as never);

      const count = await service.countUnread();

      expect(prisma.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isRead: false } }),
      );
      expect(count).toBe(3);
    });
  });

  describe("markRead", () => {
    it("updates isRead to true for the given id", async () => {
      vi.mocked(prisma.notification.update).mockResolvedValueOnce(MOCK_NOTIFICATION as never);

      await service.markRead("notif-1");

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { isRead: true },
      });
    });
  });

  describe("markAllRead", () => {
    it("bulk-updates all unread notifications", async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValueOnce({ count: 5 } as never);

      await service.markAllRead();

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe("existsRecent", () => {
    it("returns true when a recent notification exists for the dedup key", async () => {
      vi.mocked(prisma.notification.count).mockResolvedValueOnce(1 as never);

      const exists = await service.existsRecent("TOKEN_EXPIRED", "expired:acc-1");

      expect(exists).toBe(true);
    });

    it("returns false when no recent notification matches", async () => {
      vi.mocked(prisma.notification.count).mockResolvedValueOnce(0 as never);

      const exists = await service.existsRecent("TOKEN_EXPIRED", "expired:acc-1");

      expect(exists).toBe(false);
    });

    it("queries within the last 24 hours", async () => {
      vi.mocked(prisma.notification.count).mockResolvedValueOnce(0 as never);

      await service.existsRecent("TOKEN_EXPIRING", "expiring:acc-2");

      const calls = vi.mocked(prisma.notification.count).mock.calls;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const since = ((calls[0]?.[0]?.where?.createdAt) as any)?.gte as Date;
      const diffHours = (Date.now() - since.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(24, 0);
    });
  });
});
