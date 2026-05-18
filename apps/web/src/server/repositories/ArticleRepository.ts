import { prisma, type Article, type ArticleStatus, type Prisma } from "@gamepulse/database";
import { PAGINATION } from "@gamepulse/config";

export type ArticleFilters = {
  status?: ArticleStatus;
  sourceId?: string;
  categoryId?: string;
  q?: string;
  from?: Date;
  to?: Date;
};

export type ArticlePage = {
  items: Article[];
  nextCursor: string | null;
  hasMore: boolean;
};

export class ArticleRepository {
  async findMany(
    filters: ArticleFilters,
    cursor?: string,
    limit: number = PAGINATION.DEFAULT_LIMIT,
  ): Promise<ArticlePage> {
    const take = Math.min(limit, PAGINATION.MAX_LIMIT) + 1;

    const where: Prisma.ArticleWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.sourceId && { sourceId: filters.sourceId }),
      ...(filters.categoryId && {
        categories: { some: { categoryId: filters.categoryId } },
      }),
      ...(filters.q && {
        OR: [
          { title: { contains: filters.q, mode: "insensitive" } },
          { summary: { contains: filters.q, mode: "insensitive" } },
        ],
      }),
      ...(filters.from || filters.to
        ? {
            publishedAt: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
    };

    const items = await prisma.article.findMany({
      where,
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { publishedAt: "desc" },
      include: {
        source: { select: { id: true, name: true, logoUrl: true } },
        categories: { include: { category: true } },
        media: { select: { storedUrl: true, storedPath: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();

    return {
      items,
      nextCursor: hasMore && items.length > 0 ? (items[items.length - 1]?.id ?? null) : null,
      hasMore,
    };
  }

  async findById(id: string) {
    return prisma.article.findUnique({
      where: { id },
      include: {
        source: true,
        categories: { include: { category: true } },
        media: true,
        socialPosts: {
          include: { account: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  async findByContentHash(hash: string) {
    return prisma.duplicateHash.findUnique({ where: { hash } });
  }

  async createWithHash(
    data: Prisma.ArticleCreateInput,
    hash: string,
  ): Promise<Article> {
    return prisma.$transaction(async (tx) => {
      const article = await tx.article.create({ data });
      await tx.duplicateHash.create({
        data: { hash, articleId: article.id },
      });
      return article;
    });
  }

  async updateStatus(id: string, status: ArticleStatus) {
    return prisma.article.update({ where: { id }, data: { status } });
  }

  async updateCategories(id: string, categoryIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.articleCategory.deleteMany({ where: { articleId: id } });
      if (categoryIds.length > 0) {
        await tx.articleCategory.createMany({
          data: categoryIds.map((categoryId) => ({ articleId: id, categoryId })),
        });
      }
    });
  }

  async bulkUpdateStatus(ids: string[], status: ArticleStatus) {
    return prisma.article.updateMany({ where: { id: { in: ids } }, data: { status } });
  }

  async updateAiFields(
    id: string,
    data: { aiCaption: Prisma.InputJsonValue; aiHashtags: string[]; aiProcessedAt: Date },
  ) {
    return prisma.article.update({ where: { id }, data });
  }

  async bulkUpdateCategories(ids: string[], categoryIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.articleCategory.deleteMany({ where: { articleId: { in: ids } } });
      if (categoryIds.length > 0) {
        await tx.articleCategory.createMany({
          data: ids.flatMap((articleId) =>
            categoryIds.map((categoryId) => ({ articleId, categoryId })),
          ),
        });
      }
    });
  }

  async incrementSourceArticleCount(sourceId: string) {
    return prisma.feedSource.update({
      where: { id: sourceId },
      data: { articleCount: { increment: 1 } },
    });
  }
}
