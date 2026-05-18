import { prisma, type Tenant } from "@gamepulse/database";

export type { Tenant };

export type TenantSettings = {
  supportEmail?: string;
  footerText?: string;
  analyticsId?: string;
};

export class TenantService {
  async list(): Promise<Tenant[]> {
    return prisma.tenant.findMany({ orderBy: { createdAt: "desc" } });
  }

  async getBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { slug } });
  }

  async getByDomain(domain: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { domain } });
  }

  async create(input: {
    name: string;
    slug: string;
    domain?: string;
    primaryColor?: string;
    accentColor?: string;
  }): Promise<Tenant> {
    return prisma.tenant.create({ data: input });
  }

  async update(
    id: string,
    input: {
      name?: string;
      domain?: string;
      logoUrl?: string;
      primaryColor?: string;
      accentColor?: string;
      isActive?: boolean;
      settings?: TenantSettings;
    },
  ): Promise<Tenant> {
    return prisma.tenant.update({
      where: { id },
      data: {
        ...input,
        settings: input.settings ?? undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.tenant.delete({ where: { id } });
  }
}
