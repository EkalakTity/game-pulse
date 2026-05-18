import { describe, it, expect, vi, beforeEach } from "vitest";
import { DuplicateDetector } from "../processors/DuplicateDetector";

vi.mock("@gamepulse/database", () => ({
  prisma: {
    duplicateHash: {
      findUnique: vi.fn(),
    },
  },
  Prisma: {},
}));

import { prisma } from "@gamepulse/database";

describe("DuplicateDetector", () => {
  let detector: DuplicateDetector;

  beforeEach(() => {
    detector = new DuplicateDetector();
    vi.clearAllMocks();
  });

  describe("buildHash", () => {
    it("produces a consistent sha256 hex string", () => {
      const hash = detector.buildHash("My Article", "https://example.com/page");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns the same hash for the same inputs", () => {
      const a = detector.buildHash("Title", "https://example.com");
      const b = detector.buildHash("Title", "https://example.com");
      expect(a).toBe(b);
    });

    it("differs when title changes", () => {
      const a = detector.buildHash("Title A", "https://example.com");
      const b = detector.buildHash("Title B", "https://example.com");
      expect(a).not.toBe(b);
    });

    it("normalises title case — 'My Title' and 'my title' hash the same", () => {
      const a = detector.buildHash("My Title", "https://example.com");
      const b = detector.buildHash("MY TITLE", "https://example.com");
      expect(a).toBe(b);
    });

    it("strips UTM params from the URL before hashing", () => {
      const clean = detector.buildHash("T", "https://example.com/article");
      const dirty = detector.buildHash(
        "T",
        "https://example.com/article?utm_source=twitter&utm_medium=social&utm_campaign=launch",
      );
      expect(clean).toBe(dirty);
    });

    it("strips trailing slash from URL", () => {
      const a = detector.buildHash("T", "https://example.com/page/");
      const b = detector.buildHash("T", "https://example.com/page");
      expect(a).toBe(b);
    });

    it("preserves non-UTM query params", () => {
      const a = detector.buildHash("T", "https://example.com/article?id=42");
      const b = detector.buildHash("T", "https://example.com/article?id=99");
      expect(a).not.toBe(b);
    });

    it("falls back gracefully for malformed URLs", () => {
      expect(() => detector.buildHash("T", "not-a-url")).not.toThrow();
    });
  });

  describe("isDuplicate", () => {
    it("returns true when the hash exists in the DB", async () => {
      vi.mocked(prisma.duplicateHash.findUnique).mockResolvedValueOnce({ hash: "abc" } as never);
      expect(await detector.isDuplicate("abc")).toBe(true);
    });

    it("returns false when the hash is absent", async () => {
      vi.mocked(prisma.duplicateHash.findUnique).mockResolvedValueOnce(null);
      expect(await detector.isDuplicate("abc")).toBe(false);
    });
  });
});
