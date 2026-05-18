import { AppError, NotFoundError, ok, err, type Result } from "@gamepulse/types";
import { type SocialPostRepository, type SocialPostWithRelations } from "../repositories/SocialPostRepository";
import { type SocialAccountRepository } from "../repositories/SocialAccountRepository";
import type { PostStatus } from "@gamepulse/database";

type CreatePostInput = {
  accountId: string;
  articleId?: string;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  scheduledAt?: Date;
  createdById: string;
};

export class SocialPostService {
  constructor(
    private readonly postRepo: SocialPostRepository,
    private readonly accountRepo: SocialAccountRepository,
  ) {}

  async listPosts(opts?: {
    status?: PostStatus;
    accountId?: string;
    cursor?: string;
    limit?: number;
  }) {
    return this.postRepo.findMany(opts);
  }

  async getPost(id: string): Promise<Result<SocialPostWithRelations, AppError>> {
    const post = await this.postRepo.findById(id);
    if (!post) return err(new NotFoundError("Social post"));
    return ok(post);
  }

  async createPost(input: CreatePostInput): Promise<Result<SocialPostWithRelations, AppError>> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) return err(new NotFoundError("Social account"));
    if (!account.isActive) {
      return err(new AppError("ACCOUNT_INACTIVE", "Social account is not active", 400));
    }

    const status: PostStatus = input.scheduledAt ? "SCHEDULED" : "QUEUED";

    const post = await this.postRepo.create({
      caption: input.caption,
      hashtags: input.hashtags ?? [],
      mediaUrls: input.mediaUrls ?? [],
      scheduledAt: input.scheduledAt,
      status,
      account: { connect: { id: input.accountId } },
      ...(input.articleId && { article: { connect: { id: input.articleId } } }),
      createdBy: { connect: { id: input.createdById } },
    });

    return ok(post);
  }

  async cancelPost(id: string): Promise<Result<SocialPostWithRelations, AppError>> {
    const post = await this.postRepo.findById(id);
    if (!post) return err(new NotFoundError("Social post"));

    const cancellable: PostStatus[] = ["SCHEDULED", "QUEUED", "DRAFT"];
    if (!cancellable.includes(post.status)) {
      return err(
        new AppError("INVALID_TRANSITION", `Cannot cancel a post with status "${post.status}"`, 400),
      );
    }

    const updated = await this.postRepo.setStatus(id, "CANCELLED");
    return ok(updated);
  }

  async retryPost(id: string): Promise<Result<SocialPostWithRelations, AppError>> {
    const post = await this.postRepo.findById(id);
    if (!post) return err(new NotFoundError("Social post"));

    if (post.status !== "FAILED") {
      return err(new AppError("INVALID_TRANSITION", "Only failed posts can be retried", 400));
    }

    await this.postRepo.incrementRetry(id);
    const updated = await this.postRepo.setStatus(id, "QUEUED");
    return ok(updated);
  }
}
