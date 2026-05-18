import { prisma, type Media, type MediaType, type Prisma } from "@gamepulse/database";

export type CreateMediaInput = {
  filename: string;
  originalUrl?: string;
  storedUrl: string;
  storedPath?: string;
  mimeType: string;
  size?: number;
  width?: number;
  height?: number;
  type?: MediaType;
  articleId?: string;
};

export class MediaRepository {
  async create(data: CreateMediaInput): Promise<Media> {
    return prisma.media.create({ data });
  }

  async findByArticleId(articleId: string): Promise<Media[]> {
    return prisma.media.findMany({
      where: { articleId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Media | null> {
    return prisma.media.findUnique({ where: { id } });
  }

  async findByStoredPath(storedPath: string): Promise<Media | null> {
    return prisma.media.findFirst({ where: { storedPath } });
  }

  async linkToArticle(id: string, articleId: string): Promise<Media> {
    return prisma.media.update({ where: { id }, data: { articleId } });
  }

  async delete(id: string): Promise<void> {
    await prisma.media.delete({ where: { id } });
  }
}
