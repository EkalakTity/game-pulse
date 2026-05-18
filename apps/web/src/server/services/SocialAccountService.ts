import { type SocialAccount, type SocialPlatform, Prisma } from "@gamepulse/database";
import { AppError, NotFoundError, ConflictError, ok, err, type Result } from "@gamepulse/types";
import { type SocialAccountRepository } from "../repositories/SocialAccountRepository";
import { encryptToken } from "@/lib/crypto/tokenEncryption";

type SafeAccount = Omit<SocialAccount, "accessToken" | "refreshToken">;

type CreateAccountInput = {
  platform: SocialPlatform;
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  metadata?: Record<string, unknown>;
};

type UpdateAccountInput = {
  accountName?: string;
  accessToken?: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
};

function sanitize(account: SocialAccount): SafeAccount {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessToken: _a, refreshToken: _r, ...safe } = account;
  return safe;
}

export class SocialAccountService {
  constructor(private readonly repo: SocialAccountRepository) {}

  async listAccounts(platform?: SocialPlatform): Promise<SafeAccount[]> {
    const accounts = await this.repo.findAll(platform);
    return accounts.map(sanitize);
  }

  async getAccount(id: string): Promise<Result<SafeAccount, AppError>> {
    const account = await this.repo.findById(id);
    if (!account) return err(new NotFoundError("Social account"));
    return ok(sanitize(account));
  }

  async createAccount(input: CreateAccountInput): Promise<Result<SafeAccount, AppError>> {
    const existing = await this.repo.findByPlatformAndAccountId(input.platform, input.accountId);
    if (existing) {
      return err(
        new ConflictError(
          `Account "${input.accountId}" on ${input.platform} is already connected`,
        ),
      );
    }

    const account = await this.repo.create({
      platform: input.platform,
      accountName: input.accountName,
      accountId: input.accountId,
      accessToken: encryptToken(input.accessToken),
      refreshToken: input.refreshToken ? encryptToken(input.refreshToken) : undefined,
      tokenExpiresAt: input.tokenExpiresAt,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    });

    return ok(sanitize(account));
  }

  async updateAccount(id: string, input: UpdateAccountInput): Promise<Result<SafeAccount, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing) return err(new NotFoundError("Social account"));

    const updated = await this.repo.update(id, {
      ...(input.accountName !== undefined && { accountName: input.accountName }),
      ...(input.accessToken !== undefined && { accessToken: encryptToken(input.accessToken) }),
      ...(input.refreshToken !== undefined && {
        refreshToken: input.refreshToken ? encryptToken(input.refreshToken) : null,
      }),
      ...(input.tokenExpiresAt !== undefined && { tokenExpiresAt: input.tokenExpiresAt }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    return ok(sanitize(updated));
  }

  async deleteAccount(id: string): Promise<Result<void, AppError>> {
    const existing = await this.repo.findById(id);
    if (!existing) return err(new NotFoundError("Social account"));
    await this.repo.delete(id);
    return ok(undefined);
  }
}
