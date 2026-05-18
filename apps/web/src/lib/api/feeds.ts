import { apiClient } from "./client";
import type { FeedSource } from "@gamepulse/database";

export const feedsApi = {
  list: (params?: { status?: string }) =>
    apiClient.get<FeedSource[]>(`/feeds${params?.status ? `?status=${params.status}` : ""}`),

  get: (id: string) => apiClient.get<FeedSource>(`/feeds/${id}`),

  create: (data: { name: string; url: string; description?: string; fetchIntervalMin?: number }) =>
    apiClient.post<FeedSource>("/feeds", data),

  update: (id: string, data: Partial<{ name: string; url: string; status: string; fetchIntervalMin: number }>) =>
    apiClient.patch<FeedSource>(`/feeds/${id}`, data),

  delete: (id: string) => apiClient.delete<null>(`/feeds/${id}`),

  refresh: (id: string) => apiClient.post<{ jobId: string }>(`/feeds/${id}/refresh`, {}),
};
