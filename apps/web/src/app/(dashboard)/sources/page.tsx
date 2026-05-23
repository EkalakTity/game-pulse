import { prisma } from "@gamepulse/database";
import { PageHeader } from "@/components/shared/PageHeader";
import { SourcesClient } from "@/components/sources/SourcesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Feed Sources" };

export default async function SourcesPage() {
  const sources = await prisma.feedSource.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });

  const stats = {
    total: sources.length,
    active: sources.filter((s) => s.status === "ACTIVE").length,
    errored: sources.filter((s) => s.status === "ERROR").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feed Sources"
        description={`${stats.active} active · ${stats.errored} with errors · ${stats.total} total`}
      />

      <SourcesClient initialSources={sources} />
    </div>
  );
}
