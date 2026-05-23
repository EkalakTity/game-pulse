import { z } from "zod";

export const createSocialPostSchema = z.object({
  accountId: z.string().min(1),
  articleId: z.string().min(1).optional(),
  caption: z.string().max(63206).optional(),
  hashtags: z.array(z.string().max(100)).max(30).default([]),
  mediaUrls: z.array(z.string().url()).max(10).default([]),
  scheduledAt: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  adComment: z.string().max(2000).optional(),
});

export const socialPostListSchema = z.object({
  status: z
    .enum(["DRAFT", "SCHEDULED", "QUEUED", "PUBLISHED", "FAILED", "CANCELLED"])
    .optional(),
  accountId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
