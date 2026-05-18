import { apiClient } from "./client";

export type AiCaptions = {
  fb: string;
  ig: string;
  tiktok: string;
  line: string;
};

export type AiSuggestion = {
  captions: AiCaptions;
  hashtags: string[];
};

export const articlesApi = {
  processAi: (id: string) =>
    apiClient.post<AiSuggestion>(`/articles/${id}/process-ai`, {}),
};
