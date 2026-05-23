import { PrismaClient } from "@prisma/client";
import { createDecipheriv } from "crypto";
import axios from "axios";

const prisma = new PrismaClient();

function decryptToken(ciphertext: string): string {
  const key = process.env["TOKEN_ENCRYPTION_KEY"]!;
  const [ivB64, authTagB64, dataB64] = ciphertext.split(":") as [string, string, string];
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  return decipher.update(Buffer.from(dataB64, "base64")).toString("utf8") + decipher.final("utf8");
}

async function main() {
  const account = await prisma.socialAccount.findFirst({
    where: { platform: "FACEBOOK", isActive: true },
  });
  if (!account) { console.error("No Facebook account found"); return; }

  const token = decryptToken(account.accessToken);

  // Check token info
  const debug = await axios.get("https://graph.facebook.com/debug_token", {
    params: { input_token: token, access_token: token },
  }).catch(e => ({ data: e.response?.data }));
  console.log("Token debug:", JSON.stringify(debug.data, null, 2));

  // Try /me to see what the token represents
  const me = await axios.get("https://graph.facebook.com/v19.0/me", {
    params: { access_token: token, fields: "id,name" },
  }).catch(e => ({ data: e.response?.data }));
  console.log("\n/me:", JSON.stringify(me.data, null, 2));

  // Try /me/accounts to list pages
  const pages = await axios.get("https://graph.facebook.com/v19.0/me/accounts", {
    params: { access_token: token },
  }).catch(e => ({ data: e.response?.data }));
  console.log("\n/me/accounts:", JSON.stringify(pages.data, null, 2));
}

main().finally(() => prisma.$disconnect());
