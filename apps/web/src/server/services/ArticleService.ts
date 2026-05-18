import crypto from "node:crypto";
import { type Article, type ArticleStatus, type Prisma } from "@gamepulse/database";
import { AppError, NotFoundError, ConflictError, ok, err, type Result } from "@gamepulse/types";
import { type ArticleRepository, type ArticleFilters, type ArticlePage } from "../repositories/ArticleRepository";
import { createAIClient, generateArticleContent, type AiResult } from "./AIService";

type CreateArticleInput = {
  externalId?: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  sourceId: string;
  thumbnailUrl?: string;
};

export class ArticleService {
  constructor(private readonly articleRepo: ArticleRepository) {}

  async listArticles(
    filters: ArticleFilters,
    cursor?: string,
    limit?: number,
  ): Promise<ArticlePage> {
    return this.articleRepo.findMany(filters, cursor, limit);
  }

  async getArticle(id: string): Promise<Result<Article, AppError>> {
    const article = await this.articleRepo.findById(id);
    if (!article) return err(new NotFoundError("Article"));
    return ok(article);
  }

  async ingestArticle(input: CreateArticleInput): Promise<Result<Article, AppError>> {
    const hash = this.buildContentHash(input.title, input.url);

    const existing = await this.articleRepo.findByContentHash(hash);
    if (existing) {
      return err(new ConflictError(`Duplicate article detected (hash: ${hash})`));
    }

    const article = await this.articleRepo.createWithHash(
      {
        externalId: input.externalId,
        title: input.title,
        summary: input.summary,
        content: input.content,
        url: input.url,
        author: input.author,
        publishedAt: input.publishedAt,
        thumbnailUrl: input.thumbnailUrl,
        contentHash: hash,
        source: { connect: { id: input.sourceId } },
      },
      hash,
    );

    await this.articleRepo.incrementSourceArticleCount(input.sourceId);
    return ok(article);
  }

  async updateStatus(id: string, status: ArticleStatus): Promise<Result<Article, AppError>> {
    const existing = await this.articleRepo.findById(id);
    if (!existing) return err(new NotFoundError("Article"));

    const updated = await this.articleRepo.updateStatus(id, status);
    return ok(updated);
  }

  async updateCategories(id: string, categoryIds: string[]): Promise<Result<void, AppError>> {
    const existing = await this.articleRepo.findById(id);
    if (!existing) return err(new NotFoundError("Article"));

    await this.articleRepo.updateCategories(id, categoryIds);
    return ok(undefined);
  }

  async processAi(id: string): Promise<Result<AiResult, AppError>> {
    const article = await this.articleRepo.findById(id);
    if (!article) return err(new NotFoundError("Article"));

    // Return cached result if already processed
    if (article.aiCaption && article.aiHashtags.length > 0) {
      return ok({
        captions: article.aiCaption as AiResult["captions"],
        hashtags: article.aiHashtags,
      });
    }

    const client = createAIClient();
    const result = await generateArticleContent(client, article.title, article.summary);

    await this.articleRepo.updateAiFields(id, {
      aiCaption: result.captions as Prisma.InputJsonValue,
      aiHashtags: result.hashtags,
      aiProcessedAt: new Date(),
    });

    return ok(result);
  }

  async bulkAction(
    ids: string[],
    action: "ARCHIVE" | "CATEGORIZE",
    payload?: { categoryIds?: string[] },
  ): Promise<Result<{ count: number }, AppError>> {
    if (action === "ARCHIVE") {
      const result = await this.articleRepo.bulkUpdateStatus(ids, "ARCHIVED");
      return ok({ count: result.count });
    }

    if (action === "CATEGORIZE") {
      const categoryIds = payload?.categoryIds ?? [];
      await this.articleRepo.bulkUpdateCategories(ids, categoryIds);
      return ok({ count: ids.length });
    }

    return ok({ count: 0 });
  }

  private buildContentHash(title: string, url: string): string {
    const normalized = `${title.toLowerCase().trim()}${this.stripUrlParams(url)}`;
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  private stripUrlParams(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.search = "";
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return url;
    }
  }
}
