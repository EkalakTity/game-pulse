import { NextRequest, NextResponse } from "next/server";
import { ApiKeyService } from "@/server/services/ApiKeyService";

const service = new ApiKeyService();

export async function withApiKey(req: NextRequest): Promise<NextResponse | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const rawKey = auth.slice(7);
  const key = await service.validate(rawKey);
  if (!key) {
    return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
  }

  return null;
}
