import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Clearing all articles ===\n");

  // 1. duplicate_hashes — required FK to articles, no cascade, must go first
  const { count: hashes } = await prisma.duplicateHash.deleteMany({});
  console.log(`Deleted ${hashes} duplicate hashes`);

  // 2. media — optional FK (SetNull), delete article-linked media before articles
  const { count: media } = await prisma.media.deleteMany({
    where: { articleId: { not: null } },
  });
  console.log(`Deleted ${media} media records`);

  // 3. articles — cascades: article_categories, article_translations, article_videos
  //              sets null:  media (remaining), social_posts
  const { count: articles } = await prisma.article.deleteMany({});
  console.log(`Deleted ${articles} articles`);

  // 4. reset feed source article counts
  const { count: sources } = await prisma.feedSource.updateMany({
    data: { articleCount: 0 },
  });
  console.log(`Reset articleCount on ${sources} feed sources`);

  console.log("\nDone. All articles cleared.");
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
