import { prisma } from "@gamepulse/database";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoriesClient } from "@/components/categories/CategoriesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description={`${categories.length} categories — used for auto-classification and feed filtering`}
      />
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
