import { apiClient } from "./client";
import type { PostStatus } from "@gamepulse/database";
import type { SocialPostWithRelations } from "@/server/repositories/SocialPostRepository";

export type CreatePostPayload = {
  accountId: string;
  articleId?: string;
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  scheduledAt?: string;
};

export const socialPostsApi = {
  list: (params?: { status?: PostStatus; accountId?: string; cursor?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.accountId) qs.set("accountId", params.accountId);
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (params?.limit) qs.set("limit", String(params.limit));
    const str = qs.toString();
    return apiClient.get<SocialPostWithRelations[]>(`/social-posts${str ? `?${str}` : ""}`);
  },
  create: (payload: CreatePostPayload) =>
    apiClient.post<SocialPostWithRelations>("/social-posts", payload),
  cancel: (id: string) =>
    apiClient.post<SocialPostWithRelations>(`/social-posts/${id}/cancel`, {}),
  retry: (id: string) =>
    apiClient.post<SocialPostWithRelations>(`/social-posts/${id}/retry`, {}),
};
