import { prisma, type PostStatus, type Prisma } from "@gamepulse/database";

export type SocialPostWithRelations = Prisma.SocialPostGetPayload<{
  include: {
    account: { select: { platform: true; accountName: true } };
    article: { select: { id: true; title: true; thumbnailUrl: true } };
  };
}>;

export type SocialPostPage = {
  items: SocialPostWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
};

const INCLUDE = {
  account: { select: { platform: true, accountName: true } },
  article: { select: { id: true, title: true, thumbnailUrl: true } },
} as const;

export class SocialPostRepository {
  async findMany(opts?: {
    status?: PostStatus;
    accountId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<SocialPostPage> {
    const limit = Math.min(opts?.limit ?? 20, 100);
    const take = limit + 1;

    const items = await prisma.socialPost.findMany({
      where: {
        ...(opts?.status && { status: opts.status }),
        ...(opts?.accountId && { accountId: opts.accountId }),
      },
      take,
      ...(opts?.cursor && { cursor: { id: opts.cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: INCLUDE,
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
      items,
      nextCursor: hasMore && items.length > 0 ? (items[items.length - 1]?.id ?? null) : null,
      hasMore,
    };
  }

  async findDueScheduled(): Promise<SocialPostWithRelations[]> {
    return prisma.socialPost.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      include: INCLUDE,
    });
  }

  async findById(id: string): Promise<SocialPostWithRelations | null> {
    return prisma.socialPost.findUnique({ where: { id }, include: INCLUDE });
  }

  async create(data: Prisma.SocialPostCreateInput): Promise<SocialPostWithRelations> {
    return prisma.socialPost.create({ data, include: INCLUDE });
  }

  async setStatus(
    id: string,
    status: PostStatus,
    extra?: { externalPostId?: string; failureReason?: string; publishedAt?: Date },
  ): Promise<SocialPostWithRelations> {
    return prisma.socialPost.update({ where: { id }, data: { status, ...extra }, include: INCLUDE });
  }

  async incrementRetry(id: string): Promise<void> {
    await prisma.socialPost.update({
      where: { id },
      data: { retryCount: { increment: 1 } },
    });
  }
}
