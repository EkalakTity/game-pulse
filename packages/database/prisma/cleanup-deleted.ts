import { prisma } from "../src";

async function main() {
  const result = await prisma.feedSource.updateMany({
    where: { status: "PAUSED", deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (result.count > 0) {
    console.log(`[cleanup-deleted] Stamped deletedAt on ${result.count} legacy PAUSED feed(s)`);
  } else {
    console.log("[cleanup-deleted] No legacy PAUSED feeds to clean up");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[cleanup-deleted] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
