const CLOUD = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"] ?? "";
const BASE   = `https://res.cloudinary.com/${CLOUD}/image/upload`;

type TransformOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "thumb" | "scale";
  quality?: number | "auto";
  format?: "auto" | "webp" | "jpg" | "png";
};

export function cloudinaryUrl(publicId: string, opts: TransformOptions = {}): string {
  if (!CLOUD || !publicId) return publicId;

  const parts: string[] = [];
  if (opts.width)   parts.push(`w_${opts.width}`);
  if (opts.height)  parts.push(`h_${opts.height}`);
  if (opts.crop)    parts.push(`c_${opts.crop}`);
  if (opts.quality) parts.push(`q_${opts.quality}`);
  if (opts.format)  parts.push(`f_${opts.format}`);

  const transform = parts.length > 0 ? `${parts.join(",")}/` : "";
  return `${BASE}/${transform}${publicId}`;
}

export const thumbnailUrl = (publicId: string) =>
  cloudinaryUrl(publicId, { width: 80, height: 80, crop: "fill", quality: "auto", format: "auto" });

export const heroUrl = (publicId: string) =>
  cloudinaryUrl(publicId, { width: 1200, height: 630, crop: "limit", quality: "auto", format: "auto" });

export const socialUrl = (publicId: string, platform: "FACEBOOK" | "INSTAGRAM" | "TIKTOK" | "LINE_OA") => {
  const sizes: Record<string, [number, number]> = {
    FACEBOOK:  [1200, 630],
    INSTAGRAM: [1080, 1080],
    TIKTOK:    [1080, 1920],
    LINE_OA:   [1200, 628],
  };
  const [w, h] = sizes[platform] ?? [1200, 630];
  return cloudinaryUrl(publicId, { width: w, height: h, crop: "fill", quality: "auto", format: "auto" });
};

export function isCloudinaryPublicId(value: string): boolean {
  return Boolean(CLOUD) && !value.startsWith("http");
}

export function resolveImageUrl(storedUrl: string, storedPath: string | null | undefined, preset: "thumbnail" | "hero" = "thumbnail"): string {
  if (storedPath && CLOUD) {
    return preset === "hero" ? heroUrl(storedPath) : thumbnailUrl(storedPath);
  }
  return storedUrl;
}
