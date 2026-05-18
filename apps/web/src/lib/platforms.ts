import type { SocialPlatform } from "@gamepulse/database";

export const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; color: string; bg: string; captionLimit: number; hashtagLimit: number }
> = {
  FACEBOOK:  { label: "Facebook",  color: "#1877F2", bg: "#1877F220", captionLimit: 63206, hashtagLimit: 30 },
  INSTAGRAM: { label: "Instagram", color: "#E1306C", bg: "#E1306C20", captionLimit: 2200,  hashtagLimit: 30 },
  TIKTOK:    { label: "TikTok",    color: "#EE1D52", bg: "#EE1D5220", captionLimit: 2200,  hashtagLimit: 20 },
  LINE_OA:   { label: "LINE OA",   color: "#00B900", bg: "#00B90020", captionLimit: 5000,  hashtagLimit: 0  },
};
