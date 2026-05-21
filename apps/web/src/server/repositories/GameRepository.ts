import { prisma, type InterestedGame } from "@gamepulse/database";

export type { InterestedGame };

export class GameRepository {
  async findAll(): Promise<InterestedGame[]> {
    return prisma.interestedGame.findMany({ orderBy: { name: "asc" } });
  }

  async findBySlug(slug: string): Promise<InterestedGame | null> {
    return prisma.interestedGame.findUnique({ where: { slug } });
  }

  async findById(id: string): Promise<InterestedGame | null> {
    return prisma.interestedGame.findUnique({ where: { id } });
  }

  async create(data: { name: string; slug: string; imageUrl?: string }): Promise<InterestedGame> {
    return prisma.interestedGame.create({ data });
  }

  async delete(id: string): Promise<void> {
    await prisma.interestedGame.delete({ where: { id } });
  }
}
