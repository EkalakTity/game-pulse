import { prisma } from "@gamepulse/database";
import { createNotification, notificationExistsRecent } from "../lib/notify";
import { buildTokenExpiredEmail, buildTokenExpiringEmail } from "../lib/email";

const EXPIRY_WARN_DAYS = 7;

export async function runTokenExpiryCheck(): Promise<void> {
  const now = new Date();
  const warnBefore = new Date(now.getTime() + EXPIRY_WARN_DAYS * 24 * 60 * 60 * 1000);

  const accounts = await prisma.socialAccount.findMany({
    where: {
      isActive: true,
      tokenExpiresAt: { not: null },
    },
    select: {
      id: true,
      platform: true,
      accountName: true,
      tokenExpiresAt: true,
    },
  });

  for (const account of accounts) {
    if (!account.tokenExpiresAt) continue;

    const isExpired = account.tokenExpiresAt <= now;
    const isExpiringSoon = !isExpired && account.tokenExpiresAt <= warnBefore;

    if (isExpired) {
      const key = `expired:${account.id}`;
      if (await notificationExistsRecent("TOKEN_EXPIRED", key)) continue;
      await createNotification(
        "TOKEN_EXPIRED",
        "Social Account Token Expired",
        `${account.platform} account "${account.accountName}" token has expired. Reconnect the account to resume publishing.`,
        { dedupKey: key, accountId: account.id, platform: account.platform },
        { email: buildTokenExpiredEmail(account.platform, account.accountName) },
      );
    } else if (isExpiringSoon) {
      const daysLeft = Math.ceil(
        (account.tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const key = `expiring:${account.id}`;
      if (await notificationExistsRecent("TOKEN_EXPIRING", key)) continue;
      await createNotification(
        "TOKEN_EXPIRING",
        "Social Account Token Expiring Soon",
        `${account.platform} account "${account.accountName}" token expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Reconnect before it expires.`,
        { dedupKey: key, accountId: account.id, platform: account.platform, daysLeft },
        { email: buildTokenExpiringEmail(account.platform, account.accountName, daysLeft) },
      );
    }
  }

  console.log(`[TokenExpiryCheck] Checked ${accounts.length} accounts`);
}
