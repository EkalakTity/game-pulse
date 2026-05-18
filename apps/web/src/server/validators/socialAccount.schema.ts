import { z } from "zod";

export const createSocialAccountSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINE_OA"]),
  accountName: z.string().min(1).max(100).trim(),
  accountId: z.string().min(1).max(100).trim(),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  metadata: z.record(z.unknown()).optional(),
});

export const updateSocialAccountSchema = z.object({
  accountName: z.string().min(1).max(100).trim().optional(),
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().nullable().optional(),
  tokenExpiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((v) => (v ? new Date(v) : v === null ? null : undefined)),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const socialAccountListSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINE_OA"]).optional(),
});
