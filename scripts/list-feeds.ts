import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.feedSource
  .findMany({ select: { id: true, name: true, url: true, status: true, lastFetchedAt: true, fetchIntervalMin: true } })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(e => console.error(e.message))
  .finally(() => p.$disconnect());
