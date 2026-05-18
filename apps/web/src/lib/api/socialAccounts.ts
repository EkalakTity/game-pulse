import { apiClient } from "./client";
import type { SocialAccount, SocialPlatform } from "@gamepulse/database";

export type SafeSocialAccount = Omit<SocialAccount, "accessToken" | "refreshToken">;

export type CreateAccountPayload = {
  platform: SocialPlatform;
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
};

export const socialAccountsApi = {
  list: (platform?: SocialPlatform) => {
    const qs = platform ? `?platform=${platform}` : "";
    return apiClient.get<SafeSocialAccount[]>(`/social-accounts${qs}`);
  },
  create: (payload: CreateAccountPayload) =>
    apiClient.post<SafeSocialAccount>("/social-accounts", payload),
  update: (id: string, payload: Partial<CreateAccountPayload> & { isActive?: boolean }) =>
    apiClient.patch<SafeSocialAccount>(`/social-accounts/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/social-accounts/${id}`),
};
