import { PageHeader } from "@/components/shared/PageHeader";
import { ScheduleClient } from "@/components/schedule/ScheduleClient";
import { SocialPostRepository } from "@/server/repositories/SocialPostRepository";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Schedule" };

const postRepo = new SocialPostRepository();

export default async function SchedulePage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const page = await postRepo.findMany({
    status: "SCHEDULED",
    limit: 100,
  });

  const scheduledThisMonth = page.items.filter(
    (p) =>
      p.scheduledAt &&
      new Date(p.scheduledAt) >= startOfMonth &&
      new Date(p.scheduledAt) <= endOfMonth,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description={`${scheduledThisMonth.length} posts scheduled this month`}
      />
      <ScheduleClient initialPosts={page.items} />
    </div>
  );
}
