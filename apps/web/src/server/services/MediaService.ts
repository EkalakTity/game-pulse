import { v2 as cloudinary } from "cloudinary";
import { type Media, type MediaType } from "@gamepulse/database";
import { ok, err, type Result, AppError } from "@gamepulse/types";
import { type MediaRepository } from "../repositories/MediaRepository";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key:    process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure:     true,
});

export type UploadResult = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export class MediaService {
  constructor(private readonly mediaRepo: MediaRepository) {}

  async uploadFile(
    buffer: Buffer,
    filename: string,
    opts: { articleId?: string; type?: MediaType; mimeType: string },
  ): Promise<Result<Media, AppError>> {
    try {
      const upload = await new Promise<UploadResult>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "gamepulse", resource_type: "image" },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("Upload failed"));
            resolve({
              publicId: result.public_id,
              url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
            });
          },
        );
        stream.end(buffer);
      });

      const media = await this.mediaRepo.create({
        filename,
        storedUrl: upload.url,
        storedPath: upload.publicId,
        mimeType: opts.mimeType,
        size: upload.bytes,
        width: upload.width,
        height: upload.height,
        type: opts.type ?? "THUMBNAIL",
        articleId: opts.articleId,
      });

      return ok(media);
    } catch (error) {
      return err(new AppError("UPLOAD_FAILED", (error as Error).message));
    }
  }

  async uploadFromUrl(
    imageUrl: string,
    opts: { articleId?: string; type?: MediaType },
  ): Promise<Result<Media, AppError>> {
    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: "gamepulse",
        resource_type: "image",
      });

      const media = await this.mediaRepo.create({
        filename: result.original_filename ?? result.public_id,
        originalUrl: imageUrl,
        storedUrl: result.secure_url,
        storedPath: result.public_id,
        mimeType: `image/${result.format}`,
        size: result.bytes,
        width: result.width,
        height: result.height,
        type: opts.type ?? "THUMBNAIL",
        articleId: opts.articleId,
      });

      return ok(media);
    } catch (error) {
      return err(new AppError("UPLOAD_FAILED", (error as Error).message));
    }
  }
}
