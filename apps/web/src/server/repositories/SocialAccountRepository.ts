import { prisma, type SocialAccount, type SocialPlatform, type Prisma } from "@gamepulse/database";

export class SocialAccountRepository {
  async findAll(platform?: SocialPlatform): Promise<SocialAccount[]> {
    return prisma.socialAccount.findMany({
      where: platform ? { platform } : undefined,
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: string): Promise<SocialAccount | null> {
    return prisma.socialAccount.findUnique({ where: { id } });
  }

  async findByPlatformAndAccountId(
    platform: SocialPlatform,
    accountId: string,
  ): Promise<SocialAccount | null> {
    return prisma.socialAccount.findUnique({
      where: { platform_accountId: { platform, accountId } },
    });
  }

  async create(data: Prisma.SocialAccountCreateInput): Promise<SocialAccount> {
    return prisma.socialAccount.create({ data });
  }

  async update(id: string, data: Prisma.SocialAccountUpdateInput): Promise<SocialAccount> {
    return prisma.socialAccount.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.socialAccount.delete({ where: { id } });
  }
}
