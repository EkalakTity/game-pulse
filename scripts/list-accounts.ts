import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.socialAccount
  .findMany({ select: { id: true, platform: true, accountId: true, accountName: true, isActive: true, createdAt: true } })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(e => console.error(e.message))
  .finally(() => p.$disconnect());
