import { prisma, type FeedSource, type FeedStatus, type Prisma } from "@gamepulse/database";

export type FeedPage = {
  items: FeedSource[];
  nextCursor: string | null;
  hasMore: boolean;
};

export class FeedRepository {
  async findMany(status?: FeedStatus, cursor?: string, limit = 20): Promise<FeedPage> {
    const take = Math.min(limit, 100) + 1;

    const items = await prisma.feedSource.findMany({
      where: status ? { status } : undefined,
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { name: "asc" },
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
      items,
      nextCursor: hasMore && items.length > 0 ? (items[items.length - 1]?.id ?? null) : null,
      hasMore,
    };
  }

  async findAll(): Promise<FeedSource[]> {
    return prisma.feedSource.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<FeedSource | null> {
    return prisma.feedSource.findUnique({ where: { id } });
  }

  async findByUrl(url: string): Promise<FeedSource | null> {
    return prisma.feedSource.findUnique({ where: { url } });
  }

  async create(data: Prisma.FeedSourceCreateInput): Promise<FeedSource> {
    return prisma.feedSource.create({ data });
  }

  async update(id: string, data: Prisma.FeedSourceUpdateInput): Promise<FeedSource> {
    return prisma.feedSource.update({ where: { id }, data });
  }

  async setStatus(id: string, status: FeedStatus): Promise<FeedSource> {
    return prisma.feedSource.update({ where: { id }, data: { status } });
  }

  async markFetchError(id: string, error: string): Promise<void> {
    await prisma.feedSource.update({
      where: { id },
      data: { lastError: error, lastErrorAt: new Date(), status: "ERROR" },
    });
  }

  async markFetchSuccess(id: string): Promise<void> {
    await prisma.feedSource.update({
      where: { id },
      data: { lastFetchedAt: new Date(), lastError: null, lastErrorAt: null, status: "ACTIVE" },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.feedSource.update({ where: { id }, data: { status: "PAUSED" } });
  }
}
