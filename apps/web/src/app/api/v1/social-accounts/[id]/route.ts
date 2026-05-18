import { NextRequest, NextResponse } from "next/server";
import { updateSocialAccountSchema } from "@/server/validators/socialAccount.schema";
import { SocialAccountService } from "@/server/services/SocialAccountService";
import { SocialAccountRepository } from "@/server/repositories/SocialAccountRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new SocialAccountService(new SocialAccountRepository());

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await service.getAccount(params.id);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const input = updateSocialAccountSchema.parse(body);
    const result = await service.updateAccount(params.id, input);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const result = await service.deleteAccount(params.id);
    if (!result.success) return handleApiError(result.error);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
