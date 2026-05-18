import { Resend } from "resend";
import { env } from "@gamepulse/config";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

type EmailPayload = {
  subject: string;
  html: string;
};

export async function sendCriticalEmail(payload: EmailPayload): Promise<void> {
  const resend = getClient();
  if (!resend || !env.NOTIFICATION_EMAIL) return;

  try {
    await resend.emails.send({
      from: "GamePulse Hub <notifications@gamepulse.dev>",
      to: env.NOTIFICATION_EMAIL,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (err) {
    // Email failure must never crash the worker
    console.error("[email] Failed to send notification email:", err);
  }
}

function emailHtml(title: string, body: string, color = "#ef4444"): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0f0f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f17;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#18181f;border-radius:12px;border:1px solid #2e2e3e;overflow:hidden;">
        <tr>
          <td style="background:${color};padding:4px 0;"></td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#a09ec0;">GamePulse Hub</p>
            <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#f1f0ff;">${title}</h1>
            <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#a09ec0;">${body}</p>
            <p style="margin:0;font-size:12px;color:#6b6b8a;">This is an automated alert from GamePulse Hub. Log in to manage your account.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildJobFailedEmail(platform: string, accountName: string, reason: string): EmailPayload {
  return {
    subject: `[GamePulse] Post failed to publish on ${platform}`,
    html: emailHtml(
      "Post Failed to Publish",
      `Your post to <strong style="color:#f1f0ff;">${platform}</strong> account <strong style="color:#f1f0ff;">"${accountName}"</strong> could not be published.<br><br><strong style="color:#f1f0ff;">Reason:</strong> ${reason}`,
      "#ef4444",
    ),
  };
}

export function buildTokenExpiredEmail(platform: string, accountName: string): EmailPayload {
  return {
    subject: `[GamePulse] ${platform} account token expired — action required`,
    html: emailHtml(
      "Social Account Token Expired",
      `The access token for your <strong style="color:#f1f0ff;">${platform}</strong> account <strong style="color:#f1f0ff;">"${accountName}"</strong> has expired.<br><br>Please reconnect the account to resume publishing.`,
      "#ef4444",
    ),
  };
}

export function buildTokenExpiringEmail(platform: string, accountName: string, daysLeft: number): EmailPayload {
  return {
    subject: `[GamePulse] ${platform} token expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: emailHtml(
      "Social Account Token Expiring Soon",
      `The access token for your <strong style="color:#f1f0ff;">${platform}</strong> account <strong style="color:#f1f0ff;">"${accountName}"</strong> will expire in <strong style="color:#f1f0ff;">${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.<br><br>Reconnect the account before it expires to avoid publishing interruptions.`,
      "#f59e0b",
    ),
  };
}
