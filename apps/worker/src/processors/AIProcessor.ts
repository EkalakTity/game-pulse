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

const SYSTEM_PROMPT = `คุณคือบรรณาธิการข่าวเกมภาษาไทย มีหน้าที่วิเคราะห์ข่าวเกมและเขียนเนื้อหาสำหรับนักเล่นเกมชาวไทย เมื่อได้รับข้อมูลบทความข่าวเกม ให้:
1. เขียนสรุปข่าวภาษาไทย 2-3 ประโยคอย่างกระชับและน่าอ่าน
2. ให้คะแนนข่าว 0-100 โดยคำนึงถึงความเกี่ยวข้องกับแท็กเกม คุณภาพเนื้อหา ผลกระทบต่อวงการเกม และความทันเหตุการณ์
3. เขียน caption ภาษาไทยสำหรับแต่ละแพลตฟอร์มโซเชียลมีเดีย
4. สร้าง hashtag ภาษาอังกฤษที่เกี่ยวข้อง

คุณต้องตอบด้วย JSON object ที่ถูกต้องเพียงอย่างเดียว — ไม่มี markdown fence ไม่มีคำอธิบายเพิ่มเติม`;

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
          content: `แท็กเกม: ${gameTags.length > 0 ? gameTags.join(", ") : "ไม่ระบุ"}
เผยแพร่เมื่อ: ${hoursAgo !== null ? `${hoursAgo} ชั่วโมงที่แล้ว` : "ไม่ทราบ"}
หัวข้อ: ${title}
เนื้อหาย่อ: ${summary ?? "ไม่มีเนื้อหาย่อ"}

ตอบด้วย JSON structure นี้เท่านั้น:
{
  "summary": "สรุปข่าวภาษาไทย 2-3 ประโยค กระชับและน่าอ่าน",
  "score": 85,
  "scoreReason": "เหตุผลภาษาไทยสั้น ๆ สำหรับคะแนนนี้ ครอบคลุมความเกี่ยวข้อง คุณภาพ ผลกระทบ และความทันเหตุการณ์",
  "captions": {
    "fb": "caption Facebook ภาษาไทย บทสนทนา 2-3 ประโยค",
    "ig": "caption Instagram ภาษาไทย กระชับ ใส่ emoji ได้ 1-2 ประโยค",
    "tiktok": "caption TikTok ภาษาไทย สั้นมาก ดึงดูดสายตา มีพลัง",
    "line": "caption LINE OA ภาษาไทย เป็นมิตร ให้ข้อมูล"
  },
  "hashtags": ["gaming", "tag2", "tag3", "tag4", "tag5"]
}

เกณฑ์การให้คะแนน (0-100):
- ความเกี่ยวข้องกับแท็กเกม (0-40): ข่าวนี้เกี่ยวข้องกับ ${gameTags.length > 0 ? gameTags.join(", ") : "เกมทั่วไป"} มากแค่ไหน
- คุณภาพและความน่าเชื่อถือ (0-30): ความลึก แหล่งข้อมูล คุณภาพการเขียน
- ผลกระทบต่อวงการเกม (0-20): ความสำคัญต่อชุมชนนักเล่นเกม
- ความทันเหตุการณ์ (0-10): ${hoursAgo !== null ? `เผยแพร่เมื่อ ${hoursAgo} ชั่วโมงที่แล้ว` : "ไม่ทราบเวลาเผยแพร่"}

หมายเหตุ: hashtags ต้องเป็นภาษาอังกฤษเท่านั้น ไม่ต้องแปลเป็นไทย`,
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
