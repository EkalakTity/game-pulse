import { z } from "zod";

export const uploadMediaSchema = z.object({
  articleId: z.string().cuid().optional(),
  type: z.enum(["IMAGE", "VIDEO", "THUMBNAIL"]).default("THUMBNAIL"),
});
