import { prisma } from "@gamepulse/database";
import { PageHeader } from "@/components/shared/PageHeader";
import { ArticlesClient } from "@/components/articles/ArticlesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Articles" };

export default async function ArticlesPage() {
  const [sources, categories] = await Promise.all([
    prisma.feedSource.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Articles" description="All ingested news articles" />
      <ArticlesClient sources={sources} categories={categories} />
    </div>
  );
}
