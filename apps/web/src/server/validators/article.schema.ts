import { z } from "zod";

export const articleFiltersSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "DUPLICATE"]).optional(),
  sourceId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  q: z.string().max(200).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const updateArticleSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  categoryIds: z.array(z.string().cuid()).optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const bulkArticleSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  action: z.enum(["ARCHIVE", "CATEGORIZE", "SCHEDULE"]),
  payload: z
    .object({
      categoryIds: z.array(z.string().cuid()).optional(),
      scheduledAt: z.coerce.date().optional(),
    })
    .optional(),
});
