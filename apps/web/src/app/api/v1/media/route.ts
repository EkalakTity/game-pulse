import { NextRequest, NextResponse } from "next/server";
import { uploadMediaSchema } from "@/server/validators/media.schema";
import { MediaService } from "@/server/services/MediaService";
import { MediaRepository } from "@/server/repositories/MediaRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import type { MediaType } from "@gamepulse/database";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const mediaService = new MediaService(new MediaRepository());

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Field 'file' is required and must be a file" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 415 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 10 MB limit" },
        { status: 413 },
      );
    }

    const meta = uploadMediaSchema.parse({
      articleId: formData.get("articleId") ?? undefined,
      type:      formData.get("type")      ?? undefined,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await mediaService.uploadFile(buffer, file.name, {
      mimeType:  file.type,
      articleId: meta.articleId,
      type:      meta.type as MediaType,
    });

    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
