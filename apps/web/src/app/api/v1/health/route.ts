import { NextResponse } from "next/server";
import { prisma } from "@gamepulse/database";
import Redis from "ioredis";

export async function GET() {
  const redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  const [dbStatus, redisStatus] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  await redis.disconnect();

  const status = {
    database: dbStatus.status === "fulfilled" ? "ok" : "error",
    redis: redisStatus.status === "fulfilled" ? "ok" : "error",
  };

  const isHealthy = status.database === "ok" && status.redis === "ok";

  return NextResponse.json(
    { status: isHealthy ? "ok" : "degraded", timestamp: new Date().toISOString(), services: status },
    { status: isHealthy ? 200 : 503 },
  );
}
