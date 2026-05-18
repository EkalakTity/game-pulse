import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";
import { getTranslateQueue } from "@/lib/queue/client";

const SUPPORTED_LOCALES = ["th", "ja", "ko", "zh", "id", "vi"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const { locales } = z
      .object({ locales: z.array(z.enum(SUPPORTED_LOCALES as [string, ...string[]])).min(1) })
      .parse(await req.json());

    const queue = getTranslateQueue();
    await Promise.all(
      locales.map((locale) =>
        queue.add("TRANSLATE_ARTICLE", { articleId: params.id, locale }),
      ),
    );

    return NextResponse.json({ queued: locales.length });
  } catch (error) {
    return handleApiError(error);
  }
}
