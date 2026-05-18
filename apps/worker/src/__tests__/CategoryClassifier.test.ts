import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryClassifier } from "../processors/CategoryClassifier";

vi.mock("@gamepulse/database", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
    articleCategory: {
      createMany: vi.fn(),
    },
  },
  Prisma: {},
}));

import { prisma } from "@gamepulse/database";

const CATEGORIES = [
  { id: "cat-esports", keywords: ["esports", "tournament", "competitive", "league"] },
  { id: "cat-console", keywords: ["playstation", "xbox", "nintendo", "console", "ps5"] },
  { id: "cat-pc", keywords: ["pc gaming", "steam", "graphics card", "gpu"] },
  { id: "cat-mobile", keywords: ["mobile game", "ios", "android", "gacha"] },
];

describe("CategoryClassifier", () => {
  let classifier: CategoryClassifier;

  beforeEach(() => {
    vi.clearAllMocks();
    classifier = new CategoryClassifier();
    vi.mocked(prisma.category.findMany).mockResolvedValue(CATEGORIES as never);
  });

  it("returns the matching category for a clear title", async () => {
    const ids = await classifier.classify("New PS5 exclusive announced");
    expect(ids).toContain("cat-console");
  });

  it("returns multiple categories sorted by score (most matches first)", async () => {
    // 'tournament esports league' hits cat-esports 3 times; 'xbox' hits cat-console once
    const ids = await classifier.classify("Xbox esports tournament league season");
    expect(ids[0]).toBe("cat-esports");
    expect(ids).toContain("cat-console");
  });

  it("returns an empty array when no keyword matches", async () => {
    const ids = await classifier.classify("Weather forecast for next week");
    expect(ids).toHaveLength(0);
  });

  it("caps results at 3 categories", async () => {
    const ids = await classifier.classify(
      "PS5 esports tournament steam mobile game gpu",
    );
    expect(ids.length).toBeLessThanOrEqual(3);
  });

  it("is case-insensitive", async () => {
    const lower = await classifier.classify("playstation exclusive");
    const upper = await classifier.classify("PLAYSTATION exclusive");
    expect(lower).toEqual(upper);
  });

  it("uses the summary text for matching too", async () => {
    const ids = await classifier.classify("Big news today", "The esports tournament kicks off");
    expect(ids).toContain("cat-esports");
  });

  it("uses category cache on second call (prisma called only once)", async () => {
    await classifier.classify("ps5 game");
    await classifier.classify("nintendo switch update");
    expect(prisma.category.findMany).toHaveBeenCalledTimes(1);
  });
});
