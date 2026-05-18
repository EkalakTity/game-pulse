import Anthropic from "@anthropic-ai/sdk";

export type AiCaptions = {
  fb: string;
  ig: string;
  tiktok: string;
  line: string;
};

export type AiResult = {
  captions: AiCaptions;
  hashtags: string[];
};

export function createAIClient(): Anthropic {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey });
}

export async function generateArticleContent(
  client: Anthropic,
  title: string,
  summary: string | null,
): Promise<AiResult> {
  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: `You are a social media content writer specializing in gaming news. You create engaging, platform-appropriate captions and relevant hashtags. You MUST respond with a single valid JSON object and nothing else — no markdown fences, no explanation, no leading text.`,
    messages: [
      {
        role: "user",
        content: `Generate social media content for this gaming news article.

Title: ${title}
Summary: ${summary ?? "No summary available."}

Respond with exactly this JSON structure (no markdown, no extra text):
{
  "captions": {
    "fb": "Facebook caption here (conversational, 2-3 sentences)",
    "ig": "Instagram caption here (punchy, emoji-friendly, 1-2 sentences)",
    "tiktok": "TikTok caption here (very short, hook-style, high energy)",
    "line": "LINE OA caption here (friendly, informative)"
  },
  "hashtags": ["gaming", "tag2", "tag3", "tag4", "tag5"]
}

Guidelines:
- Facebook: conversational tone, share-worthy, 2-3 sentences
- Instagram: eye-catching, 1-2 relevant emojis, concise
- TikTok: trending energy, short punchy hook under 150 chars
- LINE OA: warm and informative, chat-friendly
- Hashtags: 5-8 relevant gaming hashtags, no # prefix, mix of specific and broad`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const text =
    message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned no structured content");

  const parsed = JSON.parse(jsonMatch[0]) as Partial<AiResult>;

  return {
    captions: {
      fb: String(parsed.captions?.fb ?? "").slice(0, 500),
      ig: String(parsed.captions?.ig ?? "").slice(0, 220),
      tiktok: String(parsed.captions?.tiktok ?? "").slice(0, 150),
      line: String(parsed.captions?.line ?? "").slice(0, 300),
    },
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map((h) => String(h).replace(/^#/, "")).filter(Boolean).slice(0, 10)
      : [],
  };
}
