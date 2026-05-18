import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@gamepulse/database";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArticleDetailClient } from "@/components/articles/ArticleDetailClient";
import type { Metadata } from "next";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: article?.title ?? "Article" };
}

export default async function ArticleDetailPage({ params }: Props) {
  const [article, categories] = await Promise.all([
    prisma.article.findUnique({
      where: { id: params.id },
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
    }),
    prisma.category.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!article) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/articles"
        className="inline-flex items-center gap-1 text-sm text-[#6b6988] hover:text-brand-300"
      >
        <ChevronLeft size={14} />
        Articles
      </Link>

      <PageHeader
        title={article.title}
        description={`${article.source.name} · ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "No date"}`}
        action={
          <StatusBadge
            status={article.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DUPLICATE"}
          />
        }
      />

      <ArticleDetailClient article={article} allCategories={categories} />
    </div>
  );
}
