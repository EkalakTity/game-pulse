import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted runs before vi.mock hoisting — gives us a stable ref to the mock fn
const mockParseURL = vi.hoisted(() => vi.fn());

vi.mock("rss-parser", () => ({
  default: class MockRssParser {
    parseURL = mockParseURL;
  },
}));

import { FeedParser } from "../processors/FeedParser";

describe("FeedParser", () => {
  let parser: FeedParser;

  beforeEach(() => {
    vi.clearAllMocks();
    parser = new FeedParser();
  });

  describe("fetch", () => {
    it("returns parsed articles from a valid feed", async () => {
      mockParseURL.mockResolvedValueOnce({
        items: [
          {
            title: "  Game Review: Elden Ring DLC  ",
            link: "https://example.com/elden-ring",
            guid: "elden-ring-001",
            contentSnippet: "A great review",
            pubDate: "Mon, 01 Jan 2024 12:00:00 GMT",
            creator: "Jane Doe",
          },
        ],
      });

      const articles = await parser.fetch("https://example.com/feed.xml");

      expect(articles).toHaveLength(1);
      expect(articles[0]!.title).toBe("Game Review: Elden Ring DLC");
      expect(articles[0]!.url).toBe("https://example.com/elden-ring");
      expect(articles[0]!.externalId).toBe("elden-ring-001");
      expect(articles[0]!.author).toBe("Jane Doe");
    });

    it("filters out items missing title or link", async () => {
      mockParseURL.mockResolvedValueOnce({
        items: [
          { title: "Valid", link: "https://example.com/valid" },
          { title: "No link" },
          { link: "https://example.com/no-title" },
          {},
        ],
      });

      const articles = await parser.fetch("https://example.com/feed.xml");
      expect(articles).toHaveLength(1);
      expect(articles[0]!.title).toBe("Valid");
    });

    it("strips HTML tags from summary", async () => {
      mockParseURL.mockResolvedValueOnce({
        items: [
          {
            title: "Title",
            link: "https://example.com",
            contentSnippet: "<p>Hello <strong>world</strong></p>",
          },
        ],
      });

      const articles = await parser.fetch("https://example.com/feed.xml");
      expect(articles[0]!.summary).toBe("Hello world");
    });

    it("extracts thumbnail from media:content", async () => {
      mockParseURL.mockResolvedValueOnce({
        items: [
          {
            title: "Title",
            link: "https://example.com",
            "media:content": { $: { url: "https://example.com/thumb.jpg" } },
          },
        ],
      });

      const articles = await parser.fetch("https://example.com/feed.xml");
      expect(articles[0]!.thumbnailUrl).toBe("https://example.com/thumb.jpg");
    });

    it("extracts thumbnail from enclosure when type is image", async () => {
      mockParseURL.mockResolvedValueOnce({
        items: [
          {
            title: "Title",
            link: "https://example.com",
            enclosure: { url: "https://example.com/img.png", type: "image/png" },
          },
        ],
      });

      const articles = await parser.fetch("https://example.com/feed.xml");
      expect(articles[0]!.thumbnailUrl).toBe("https://example.com/img.png");
    });

    it("does not extract enclosure thumbnail for non-image types", async () => {
      mockParseURL.mockResolvedValueOnce({
        items: [
          {
            title: "Title",
            link: "https://example.com",
            enclosure: { url: "https://example.com/video.mp4", type: "video/mp4" },
          },
        ],
      });

      const articles = await parser.fetch("https://example.com/feed.xml");
      expect(articles[0]!.thumbnailUrl).toBeUndefined();
    });

    it("returns empty array when feed has no items", async () => {
      mockParseURL.mockResolvedValueOnce({ items: [] });

      const articles = await parser.fetch("https://example.com/feed.xml");
      expect(articles).toHaveLength(0);
    });
  });
});
