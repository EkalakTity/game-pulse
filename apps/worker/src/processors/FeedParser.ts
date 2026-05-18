import RssParser from "rss-parser";
import axios from "axios";

export type ParsedArticle = {
  externalId?: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  thumbnailUrl?: string;
};

const parser = new RssParser({
  timeout: 10000,
  headers: { "User-Agent": "GamePulseHub/1.0 RSS Reader" },
});

export class FeedParser {
  async fetch(feedUrl: string): Promise<ParsedArticle[]> {
    const feed = await parser.parseURL(feedUrl);

    return feed.items
      .filter((item): item is typeof item & { link: string; title: string } =>
        Boolean(item.link && item.title),
      )
      .map((item) => ({
        externalId: item.guid ?? item.id,
        title: item.title.trim(),
        summary: this.stripHtml(item.contentSnippet ?? item.summary ?? ""),
        content: item.content ?? item["content:encoded"],
        url: item.link,
        author: item.creator ?? item.author,
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        thumbnailUrl: this.extractThumbnail(item),
      }));
  }

  private extractThumbnail(item: Record<string, unknown>): string | undefined {
    const enclosure = item["enclosure"] as { url?: string; type?: string } | undefined;
    if (enclosure?.url && enclosure.type?.startsWith("image/")) {
      return enclosure.url;
    }

    const mediaContent = item["media:content"] as { $?: { url?: string } } | undefined;
    if (mediaContent?.$?.url) return mediaContent.$.url;

    const mediaThumbnail = item["media:thumbnail"] as { $?: { url?: string } } | undefined;
    if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;

    return undefined;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
  }
}
