import { NextRequest, NextResponse } from "next/server";
import { socialAccountListSchema, createSocialAccountSchema } from "@/server/validators/socialAccount.schema";
import { SocialAccountService } from "@/server/services/SocialAccountService";
import { SocialAccountRepository } from "@/server/repositories/SocialAccountRepository";
import { handleApiError } from "@/server/middleware/errorHandler";
import { withAuth } from "@/lib/auth/middleware";

const service = new SocialAccountService(new SocialAccountRepository());

export async function GET(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { platform } = socialAccountListSchema.parse(params);
    const accounts = await service.listAccounts(platform);
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const authError = await withAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const input = createSocialAccountSchema.parse(body);
    const result = await service.createAccount(input);
    if (!result.success) return handleApiError(result.error);
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
