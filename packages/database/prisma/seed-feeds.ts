import { prisma } from "../src";

const FEEDS = [
  {
    name: "Eurogamer",
    url: "https://www.eurogamer.net/feed",
    description: "Eurogamer — European gaming news and reviews",
    fetchIntervalMin: 30,
  },
  {
    name: "Rock Paper Shotgun",
    url: "https://www.rockpapershotgun.com/feed",
    description: "Rock Paper Shotgun — PC gaming news and reviews",
    fetchIntervalMin: 30,
  },
  {
    name: "VG247",
    url: "https://www.vg247.com/feed",
    description: "VG247 — Video game news, previews and reviews",
    fetchIntervalMin: 30,
  },
  {
    name: "Destructoid",
    url: "https://www.destructoid.com/feed/",
    description: "Destructoid — Independent video game journalism",
    fetchIntervalMin: 30,
  },
  {
    name: "Nintendo Life",
    url: "https://www.nintendolife.com/feeds/latest",
    description: "Nintendo Life — Nintendo news, reviews and guides",
    fetchIntervalMin: 30,
  },
  {
    name: "Push Square",
    url: "https://www.pushsquare.com/feeds/latest",
    description: "Push Square — PlayStation news and reviews",
    fetchIntervalMin: 30,
  },
  {
    name: "Pure Xbox",
    url: "https://www.purexbox.com/feeds/latest",
    description: "Pure Xbox — Xbox news and reviews",
    fetchIntervalMin: 30,
  },
  {
    name: "GamesRadar+",
    url: "https://www.gamesradar.com/rss/",
    description: "GamesRadar — Multi-platform gaming news and reviews",
    fetchIntervalMin: 30,
  },
  {
    name: "TheGamer",
    url: "https://www.thegamer.com/feed/",
    description: "TheGamer — Gaming news, guides and lists",
    fetchIntervalMin: 30,
  },
  {
    name: "Game Rant",
    url: "https://gamerant.com/feed/",
    description: "Game Rant — Video game news, reviews and guides",
    fetchIntervalMin: 30,
  },
  {
    name: "PC Gamer",
    url: "https://www.pcgamer.com/rss/",
    description: "PC Gamer — PC gaming news, reviews and hardware",
    fetchIntervalMin: 30,
  },
  {
    name: "Dualshockers",
    url: "https://www.dualshockers.com/feed/",
    description: "DualShockers — Gaming news and reviews",
    fetchIntervalMin: 30,
  },
];

async function main() {
  // Only create feeds that don't already exist (by URL) — skips both active and soft-deleted
  const result = await prisma.feedSource.createMany({
    data: FEEDS.map((f) => ({
      name: f.name,
      url: f.url,
      description: f.description,
      fetchIntervalMin: f.fetchIntervalMin,
      status: "ACTIVE" as const,
      articleCount: 0,
    })),
    skipDuplicates: true,
  });

  console.log(`[seed-feeds] Added ${result.count} new feed source(s) (${FEEDS.length - result.count} already existed)`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[seed-feeds] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
