import { prisma } from "@gamepulse/database";
import { PageHeader } from "@/components/shared/PageHeader";
import { SocialClient } from "@/components/social/SocialClient";
import { SocialAccountRepository } from "@/server/repositories/SocialAccountRepository";
import { SocialPostRepository } from "@/server/repositories/SocialPostRepository";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Social Posts" };

const accountRepo = new SocialAccountRepository();
const postRepo = new SocialPostRepository();

export default async function SocialPage() {
  const [accounts, postsPage, articles] = await Promise.all([
    accountRepo.findAll(),
    postRepo.findMany({ limit: 50 }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, url: true, thumbnailUrl: true },
      orderBy: { publishedAt: "desc" },
      take: 100,
    }),
  ]);

  // Strip tokens before passing to client
  const safeAccounts = accounts.map(({ accessToken: _a, refreshToken: _r, ...rest }) => rest);

  const stats = {
    total: accounts.length,
    active: accounts.filter((a) => a.isActive).length,
    scheduled: postsPage.items.filter((p) => p.status === "SCHEDULED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Posts"
        description={`${stats.active} active accounts · ${stats.scheduled} scheduled`}
      />
      <SocialClient
        initialAccounts={safeAccounts}
        initialPosts={postsPage.items}
        articles={articles}
      />
    </div>
  );
}
