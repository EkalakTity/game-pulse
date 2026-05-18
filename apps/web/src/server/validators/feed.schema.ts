import { z } from "zod";

export const createFeedSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  url: z.string().url("Must be a valid RSS feed URL"),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  fetchIntervalMin: z.number().int().min(5).max(1440).default(15),
});

export const updateFeedSchema = createFeedSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

export const feedListSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "ERROR"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});
