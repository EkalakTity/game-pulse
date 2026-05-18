import { apiClient } from "./client";
import type { Category } from "@gamepulse/database";

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories"),

  create: (data: { name: string; slug: string; description?: string; color?: string; keywords?: string[] }) =>
    apiClient.post<Category>("/categories", data),

  update: (id: string, data: Partial<{ name: string; slug: string; description: string; color: string; keywords: string[] }>) =>
    apiClient.patch<Category>(`/categories/${id}`, data),

  delete: (id: string) => apiClient.delete<null>(`/categories/${id}`),
};
