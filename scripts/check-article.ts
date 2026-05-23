import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.article
  .findUnique({ where: { id: "cmpdp63fq0031vwj3biaxqpmd" }, select: { id: true, title: true, content: true, status: true } })
  .then(r => {
    if (r) {
      console.log("title:", r.title);
      console.log("status:", r.status);
      console.log("content length:", r.content?.length ?? 0);
    } else {
      console.log("article not found");
    }
  })
  .catch(e => console.error(e.message))
  .finally(() => p.$disconnect());
