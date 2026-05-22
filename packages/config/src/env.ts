import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  DATABASE_REPLICA_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  TOKEN_ENCRYPTION_KEY: z.string().length(64),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  NOTIFICATION_EMAIL: z.string().email().optional(),
  INGEST_WORKER_CONCURRENCY: z.coerce.number().default(5),
  PUBLISH_WORKER_CONCURRENCY: z.coerce.number().default(2),
  MEDIA_WORKER_CONCURRENCY: z.coerce.number().default(10),
  AI_WORKER_CONCURRENCY: z.coerce.number().default(2),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  if (process.env["SKIP_ENV_VALIDATION"] === "1") {
    return process.env as unknown as Env;
  }
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Environment validation failed — check .env file");
  }
  return result.data;
}

export const env = validateEnv();
