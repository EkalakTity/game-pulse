import axios from "axios";

const TIMEOUT_MS = 8000;
const USER_AGENT = "GamePulseHub/1.0 Thumbnail Extractor";

const OG_IMAGE_RE = /<meta[^>]+(?:property=["']og:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+property=["']og:image["'])[^>]*\/?>/i;
const TWITTER_IMAGE_RE = /<meta[^>]+(?:name=["']twitter:image["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+name=["']twitter:image["'])[^>]*\/?>/i;

export class ThumbnailExtractor {
  async extract(articleUrl: string): Promise<string | null> {
    try {
      const res = await axios.get<string>(articleUrl, {
        timeout: TIMEOUT_MS,
        headers: { "User-Agent": USER_AGENT },
        maxContentLength: 500_000,
        responseType: "text",
        validateStatus: (s) => s < 400,
      });

      const html = res.data;

      const og = OG_IMAGE_RE.exec(html);
      if (og) {
        const url = og[1] ?? og[2];
        if (url) return this.resolveUrl(url, articleUrl);
      }

      const twitter = TWITTER_IMAGE_RE.exec(html);
      if (twitter) {
        const url = twitter[1] ?? twitter[2];
        if (url) return this.resolveUrl(url, articleUrl);
      }

      return null;
    } catch {
      return null;
    }
  }

  private resolveUrl(url: string, base: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    try {
      return new URL(url, base).toString();
    } catch {
      return url;
    }
  }
}
