import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function withAuth(req: NextRequest) {
  // Rate limit: 120 req/min per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`api:${ip}`, { limit: 120, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json(
    { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
    { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
  );

  const token = await getToken({ req, secret: process.env["NEXTAUTH_SECRET"] });
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  return null;
}

export { rateLimitResponse };
