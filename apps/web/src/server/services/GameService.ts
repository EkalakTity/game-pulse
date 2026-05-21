import { prisma } from "@gamepulse/database";
import { ok, err, type Result } from "@gamepulse/types";
import { AppError, NotFoundError, ConflictError } from "@gamepulse/types";
import { type GameRepository, type InterestedGame } from "../repositories/GameRepository";
import { GAME_CATALOG, GENERAL_GAMING_FEEDS, searchCatalog, type CatalogGame } from "@/lib/gameFeedCatalog";

type AddedFeed = {
  id: string;
  name: string;
  url: string;
  isNew: boolean;
};

export class GameService {
  constructor(private readonly gameRepo: GameRepository) {}

  async listGames(): Promise<InterestedGame[]> {
    return this.gameRepo.findAll();
  }

  searchCatalog(query: string): CatalogGame[] {
    return searchCatalog(query);
  }

  getGeneralFeeds() {
    return GENERAL_GAMING_FEEDS;
  }

  async addGame(slug: string): Promise<Result<{ game: InterestedGame; feedsAdded: AddedFeed[] }, AppError>> {
    const catalogEntry = GAME_CATALOG.find((g) => g.slug === slug);
    if (!catalogEntry) return err(new NotFoundError(`Game "${slug}" not found in catalog`));

    const existing = await this.gameRepo.findBySlug(slug);
    if (existing) return err(new ConflictError(`You are already watching "${catalogEntry.name}"`));

    const game = await this.gameRepo.create({
      name: catalogEntry.name,
      slug: catalogEntry.slug,
      imageUrl: catalogEntry.imageUrl,
    });

    const feedsAdded: AddedFeed[] = [];
    for (const feed of catalogEntry.feeds) {
      const existingFeed = await prisma.feedSource.findUnique({ where: { url: feed.url } });
      if (existingFeed) {
        if (!existingFeed.gameTags.includes(slug)) {
          await prisma.feedSource.update({
            where: { id: existingFeed.id },
            data: { gameTags: { push: slug } },
          });
        }
        feedsAdded.push({ id: existingFeed.id, name: feed.name, url: feed.url, isNew: false });
      } else {
        const created = await prisma.feedSource.create({
          data: {
            name: feed.name,
            url: feed.url,
            description: feed.description,
            logoUrl: feed.logoUrl,
            fetchIntervalMin: feed.fetchIntervalMin,
            gameTags: [slug],
          },
        });
        feedsAdded.push({ id: created.id, name: feed.name, url: feed.url, isNew: true });
      }
    }

    return ok({ game, feedsAdded });
  }

  async removeGame(id: string): Promise<Result<void, AppError>> {
    const game = await this.gameRepo.findById(id);
    if (!game) return err(new NotFoundError("Interested game"));
    await this.gameRepo.delete(id);
    return ok(undefined);
  }
}
