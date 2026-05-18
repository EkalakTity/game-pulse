import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gamepulse.local" },
    update: {},
    create: {
      email: "admin@gamepulse.local",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Seeded admin user:", admin.email);

  const categories = [
    { name: "PC Gaming", slug: "pc-gaming", color: "#6d28d9", keywords: ["PC", "Steam", "GPU", "NVIDIA", "AMD", "Intel"] },
    { name: "Console", slug: "console", color: "#3b82f6", keywords: ["PlayStation", "Xbox", "Nintendo", "Switch", "PS5"] },
    { name: "Mobile Gaming", slug: "mobile-gaming", color: "#22c55e", keywords: ["iOS", "Android", "mobile game", "App Store"] },
    { name: "Esports", slug: "esports", color: "#ef4444", keywords: ["esports", "tournament", "championship", "competitive"] },
    { name: "Game Releases", slug: "game-releases", color: "#f59e0b", keywords: ["release date", "launch", "new game", "DLC"] },
    { name: "Industry News", slug: "industry-news", color: "#a09ec0", keywords: ["acquisition", "funding", "layoffs", "studio"] },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("Seeded", categories.length, "categories");

  const feeds = [
    { name: "IGN", url: "https://feeds.ign.com/ign/all", description: "IGN gaming news" },
    { name: "GameSpot", url: "https://www.gamespot.com/feeds/mashup/", description: "GameSpot news" },
    { name: "Polygon", url: "https://www.polygon.com/rss/index.xml", description: "Polygon gaming coverage" },
  ];

  for (const feed of feeds) {
    await prisma.feedSource.upsert({
      where: { url: feed.url },
      update: {},
      create: feed,
    });
  }
  console.log("Seeded", feeds.length, "feed sources");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
