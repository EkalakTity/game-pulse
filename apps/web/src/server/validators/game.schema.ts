import { z } from "zod";

export const addGameSchema = z.object({
  slug: z.string().min(1).max(100),
});

export const catalogSearchSchema = z.object({
  q: z.string().optional().default(""),
});
