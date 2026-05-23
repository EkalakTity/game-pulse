// Quick Facebook post test — run with:
//   cd D:\Project\claude-app && npx tsx --env-file=apps/worker/.env scripts/test-fb-post.ts
import { PrismaClient } from "@prisma/client";
import { createDecipheriv } from "crypto";
import axios from "axios";

const prisma = new PrismaClient();

function decryptToken(ciphertext: string): string {
  const key = process.env["TOKEN_ENCRYPTION_KEY"];
  if (!key || key.length !== 64) throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hex chars");
  const [ivB64, authTagB64, dataB64] = ciphertext.split(":") as [string, string, string];
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  return decipher.update(Buffer.from(dataB64, "base64")).toString("utf8") + decipher.final("utf8");
}

async function main() {
  const account = await prisma.socialAccount.findFirst({
    where: { platform: "FACEBOOK", isActive: true },
  });

  if (!account) {
    console.error("No active Facebook account found. Connect a Facebook page first.");
    process.exit(1);
  }

  console.log(`Found account: ${account.accountName} (pageId: ${account.accountId})`);

  const accessToken = decryptToken(account.accessToken);

  const message = "🧪 Test post from GamePulse Hub — this confirms Facebook publishing is working!";

  console.log("Posting to Facebook...");
  const res = await axios.post(
    `https://graph.facebook.com/v19.0/${account.accountId}/feed`,
    null,
    { params: { message, access_token: accessToken } },
  );

  console.log("✅ Posted successfully! Post ID:", res.data.id);
}

main()
  .catch(err => {
    console.error("❌ Failed:", err.response?.data ?? err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
