import { prisma } from "@gamepulse/database";

type CategoryMatch = { categoryId: string; score: number };

export class CategoryClassifier {
  private cache: { id: string; keywords: string[] }[] | null = null;
  private cacheExpiresAt = 0;

  async classify(title: string, summary?: string | null): Promise<string[]> {
    const categories = await this.getCategories();
    const text = `${title} ${summary ?? ""}`.toLowerCase();

    const matches: CategoryMatch[] = categories
      .map(({ id, keywords }) => ({
        categoryId: id,
        score: keywords.filter((kw) => text.includes(kw.toLowerCase())).length,
      }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);

    return matches.slice(0, 3).map((m) => m.categoryId);
  }

  async applyToArticle(articleId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;

    await prisma.articleCategory.createMany({
      data: categoryIds.map((categoryId) => ({ articleId, categoryId })),
      skipDuplicates: true,
    });
  }

  private async getCategories() {
    if (this.cache && Date.now() < this.cacheExpiresAt) return this.cache;

    this.cache = await prisma.category.findMany({
      select: { id: true, keywords: true },
      where: { keywords: { isEmpty: false } },
    });
    this.cacheExpiresAt = Date.now() + 5 * 60 * 1000;
    return this.cache;
  }
}
