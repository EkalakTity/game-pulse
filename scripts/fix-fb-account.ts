import { PrismaClient } from "@prisma/client";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const prisma = new PrismaClient();

function encryptToken(plaintext: string): string {
  const key = process.env["TOKEN_ENCRYPTION_KEY"]!;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

const REAL_PAGE_ID = "1117486028095245";
const REAL_PAGE_TOKEN = "EAAN8X1K1c4UBRsshZCH1bhn7kPLpDBWcO3mDRFCFdbOZCZBmtTeShG6ZCbdyx1N8uz6yVu6cGDZCdstHyub0KFgkSFYcNrRxh368MsoH1iqs5FYhO51OZAY9EbaojpKIJbCzWytObR6ZAzdx0dbGh2W95769mp3YyAbUX8e1nMAJSVoUHfd2oZCqc4C0Clo5ZAUbWGZCeNOe1RedfVwqLZCntENwGOc0jQbkdpG4B03dAZDZD";

async function main() {
  const updated = await prisma.socialAccount.updateMany({
    where: { platform: "FACEBOOK", accountId: "fb_test_page_001" },
    data: {
      accountId: REAL_PAGE_ID,
      accessToken: encryptToken(REAL_PAGE_TOKEN),
    },
  });
  console.log(`Updated ${updated.count} Facebook account(s) with real page ID and page access token.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
