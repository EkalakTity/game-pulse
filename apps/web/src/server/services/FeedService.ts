import { type FeedSource, type FeedStatus } from "@gamepulse/database";
import { AppError, NotFoundError, ConflictError, ok, err, type Result } from "@gamepulse/types";
import { type FeedRepository, type FeedPage } from "../repositories/FeedRepository";

type CreateFeedInput = {
  name: string;
  url: string;
  description?: string;
  logoUrl?: string;
  fetchIntervalMin?: number;
};

type UpdateFeedInput = Partial<CreateFeedInput> & { status?: FeedStatus };

export class FeedService {
  constructor(private readonly feedRepo: FeedRepository) {}

  async listFeeds(status?: FeedStatus, cursor?: string, limit?: number): Promise<FeedPage> {
    return this.feedRepo.findMany(status, cursor, limit);
  }

  async getFeed(id: string): Promise<Result<FeedSource, AppError>> {
    const feed = await this.feedRepo.findById(id);
    if (!feed) return err(new NotFoundError("Feed source"));
    return ok(feed);
  }

  async createFeed(input: CreateFeedInput): Promise<Result<FeedSource, AppError>> {
    const existing = await this.feedRepo.findByUrl(input.url);
    if (existing) {
      return err(new ConflictError(`A feed source with URL "${input.url}" already exists`));
    }

    const feed = await this.feedRepo.create({
      name: input.name.trim(),
      url: input.url.trim(),
      description: input.description?.trim(),
      logoUrl: input.logoUrl?.trim(),
      fetchIntervalMin: input.fetchIntervalMin ?? 15,
    });

    return ok(feed);
  }

  async updateFeed(id: string, input: UpdateFeedInput): Promise<Result<FeedSource, AppError>> {
    const existing = await this.feedRepo.findById(id);
    if (!existing) return err(new NotFoundError("Feed source"));

    if (input.url && input.url !== existing.url) {
      const urlConflict = await this.feedRepo.findByUrl(input.url);
      if (urlConflict) {
        return err(new ConflictError(`A feed source with URL "${input.url}" already exists`));
      }
    }

    const updated = await this.feedRepo.update(id, {
      ...(input.name && { name: input.name.trim() }),
      ...(input.url && { url: input.url.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl?.trim() }),
      ...(input.fetchIntervalMin && { fetchIntervalMin: input.fetchIntervalMin }),
      ...(input.status && { status: input.status }),
    });

    return ok(updated);
  }

  async deleteFeed(id: string): Promise<Result<void, AppError>> {
    const existing = await this.feedRepo.findById(id);
    if (!existing) return err(new NotFoundError("Feed source"));

    await this.feedRepo.delete(id);
    return ok(undefined);
  }
}
