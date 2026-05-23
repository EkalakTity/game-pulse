import Anthropic from "@anthropic-ai/sdk";

export type AiCaptions = {
  fb: string;
  ig: string;
  tiktok: string;
  line: string;
};

export type AiResult = {
  summary: string;
  score: number;
  scoreReason: string;
  captions: AiCaptions;
  hashtags: string[];
};

const PLATFORM_CAPTION_LIMITS: Record<keyof AiCaptions, number> = {
  fb: 500,
  ig: 220,
  tiktok: 150,
  line: 300,
};

const SYSTEM_PROMPT = `You are a gaming news analyst and social media content writer. Given a gaming news article you will:
1. Write a concise 2-3 sentence summary
2. Score the article 0-100 based on relevance to provided game tags, content quality, news impact, and timeliness
3. Generate platform-appropriate social media captions
4. Generate relevant hashtags

You MUST respond with a single valid JSON object and nothing else — no markdown fences, no explanation.`;

export class AIProcessor {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    this.client = new Anthropic({ apiKey });
  }

  async processArticle(params: {
    title: string;
    summary: string | null;
    gameTags: string[];
    publishedAt: Date | null;
  }): Promise<AiResult> {
    const { title, summary, gameTags, publishedAt } = params;

    const hoursAgo = publishedAt
      ? Math.round((Date.now() - publishedAt.getTime()) / 3_600_000)
      : null;

    const message = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Game Tags: ${gameTags.length > 0 ? gameTags.join(", ") : "none"}
Published: ${hoursAgo !== null ? `${hoursAgo} hour(s) ago` : "unknown"}
Title: ${title}
Summary: ${summary ?? "No summary available."}

Respond with exactly this JSON structure:
{
  "summary": "concise 2-3 sentence summary of the article",
  "score": 85,
  "scoreReason": "brief reason for the score covering tag relevance, quality, impact, and timeliness",
  "captions": {
    "fb": "Facebook caption (conversational, 2-3 sentences)",
    "ig": "Instagram caption (punchy, emoji-friendly, 1-2 sentences)",
    "tiktok": "TikTok caption (very short, hook-style, high energy)",
    "line": "LINE OA caption (friendly, informative)"
  },
  "hashtags": ["gaming", "tag2", "tag3", "tag4", "tag5"]
}

Scoring criteria (0-100):
- Relevance to game tags (0-40): how closely the article relates to ${gameTags.length > 0 ? gameTags.join(", ") : "general gaming"}
- Content quality & credibility (0-30): depth, sourcing, writing quality
- News impact (0-20): significance to the gaming community
- Timeliness (0-10): ${hoursAgo !== null ? `published ${hoursAgo}h ago` : "unknown publish time"}`,
        },
      ],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON found in AI response: ${text.slice(0, 200)}`);

    const parsed = JSON.parse(jsonMatch[0]) as Partial<AiResult>;

    const captions: AiCaptions = {
      fb: String(parsed.captions?.fb ?? "").slice(0, PLATFORM_CAPTION_LIMITS.fb),
      ig: String(parsed.captions?.ig ?? "").slice(0, PLATFORM_CAPTION_LIMITS.ig),
      tiktok: String(parsed.captions?.tiktok ?? "").slice(0, PLATFORM_CAPTION_LIMITS.tiktok),
      line: String(parsed.captions?.line ?? "").slice(0, PLATFORM_CAPTION_LIMITS.line),
    };

    const hashtags = Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map((h) => String(h).replace(/^#/, "")).filter(Boolean).slice(0, 10)
      : [];

    const score = typeof parsed.score === "number"
      ? Math.min(100, Math.max(0, Math.round(parsed.score)))
      : 0;

    return {
      summary: String(parsed.summary ?? ""),
      score,
      scoreReason: String(parsed.scoreReason ?? ""),
      captions,
      hashtags,
    };
  }
}
