/**
 * End-to-end loop test:
 * 1. Fetch latest article from Polygon RSS
 * 2. Save article to DB (with duplicate detection)
 * 3. Create SocialPost linked to the article + FB account
 * 4. Publish directly to Facebook Graph API
 * 5. Update post status to PUBLISHED
 * 6. Fetch analytics snapshot from Graph API
 * 7. Save analytics to SocialPostAnalytics
 *
 * Run: npx tsx --env-file=apps/worker/.env scripts/full-loop-test.ts
 */
import { PrismaClient } from "@prisma/client";
import { createDecipheriv, createHash } from "crypto";
import axios from "axios";
import RssParser from "rss-parser";

const prisma = new PrismaClient();
const rss = new RssParser({ timeout: 10000, headers: { "User-Agent": "GamePulseHub/1.0" } });
const GRAPH = "https://graph.facebook.com/v19.0";

function decryptToken(ciphertext: string): string {
  const key = process.env["TOKEN_ENCRYPTION_KEY"]!;
  const [ivB64, authTagB64, dataB64] = ciphertext.split(":") as [string, string, string];
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  return decipher.update(Buffer.from(dataB64, "base64")).toString("utf8") + decipher.final("utf8");
}

function buildHash(title: string, url: string) {
  return createHash("sha256").update(`${title}::${url}`).digest("hex");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

async function main() {
  // ── 1. Load FB account ────────────────────────────────────────────────────
  const fbAccount = await prisma.socialAccount.findFirst({
    where: { platform: "FACEBOOK", isActive: true },
  });
  if (!fbAccount) throw new Error("No active Facebook account found");
  const pageToken = decryptToken(fbAccount.accessToken);
  console.log(`✅ FB account: ${fbAccount.accountName} (${fbAccount.accountId})`);

  // ── 2. Load an admin user for createdById ─────────────────────────────────
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found in DB — seed the database first");

  // ── 3. Load Polygon feed source ───────────────────────────────────────────
  const source = await prisma.feedSource.findFirst({ where: { name: "Polygon" } });
  if (!source) throw new Error("Polygon feed source not found");

  // ── 4. Fetch RSS and pick the first unseen article ────────────────────────
  console.log("\n📡 Fetching Polygon RSS...");
  const feed = await rss.parseURL(source.url);
  let article = null;
  let articleId: string | null = null;

  for (const item of feed.items.slice(0, 10)) {
    if (!item.link || !item.title) continue;
    const hash = buildHash(item.title.trim(), item.link);
    article = item;
    // Save article or reuse existing
    let savedArticle;
    const existing = await prisma.article.findUnique({ where: { url: item.link! } });
    if (existing) {
      console.log(`  reusing existing article: "${existing.title.slice(0, 60)}"`);
      savedArticle = existing;
    } else {
      const dup = await prisma.duplicateHash.findUnique({ where: { hash } });
      if (dup) { console.log(`  skip dup: ${item.title.trim().slice(0, 60)}`); article = null; continue; }
      savedArticle = await prisma.$transaction(async (tx) => {
        const a = await tx.article.create({
          data: {
            externalId: item.guid ?? item.link,
            title: item.title!.trim(),
            summary: stripHtml(item.contentSnippet ?? item.summary ?? ""),
            content: item.content,
            url: item.link!,
            author: item.creator ?? item.author,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            contentHash: hash,
            sourceId: source.id,
          },
        });
        await tx.duplicateHash.create({ data: { hash, articleId: a.id } });
        await tx.feedSource.update({ where: { id: source.id }, data: { articleCount: { increment: 1 }, lastFetchedAt: new Date() } });
        return a;
      });
      console.log(`✅ Saved new article: "${savedArticle.title.slice(0, 70)}"`);
    }
    articleId = savedArticle.id;
    break;
  }

  if (!article || !articleId) {
    console.log("ℹ️  All recent Polygon articles already ingested. Using most recent article from DB.");
    const latest = await prisma.article.findFirst({ where: { sourceId: source.id }, orderBy: { createdAt: "desc" } });
    if (!latest) throw new Error("No articles in DB from Polygon");
    article = { title: latest.title, contentSnippet: latest.summary, link: latest.url };
    articleId = latest.id;
    console.log(`   Using: "${latest.title.slice(0, 70)}"`);
  }

  // ── 5. Build caption & post to Facebook ───────────────────────────────────
  const caption = `🎮 ${(article as any).title}\n\n${stripHtml((article as any).contentSnippet ?? "").slice(0, 200)}\n\n🔗 ${(article as any).link}`;
  const hashtags = ["Gaming", "GamePulse", "Polygon"];
  const message = `${caption}\n\n${hashtags.map(h => `#${h}`).join(" ")}`;

  // Save SocialPost to DB first
  const socialPost = await prisma.socialPost.create({
    data: {
      caption,
      hashtags,
      mediaUrls: [],
      status: "QUEUED",
      articleId,
      accountId: fbAccount.id,
      createdById: user.id,
    },
  });
  console.log(`\n📝 Created SocialPost: ${socialPost.id}`);

  // Publish to Facebook
  console.log("📤 Publishing to Facebook...");
  const fbRes = await axios.post(`${GRAPH}/${fbAccount.accountId}/feed`, null, {
    params: { message, access_token: pageToken },
  });
  const externalPostId: string = fbRes.data.id;
  console.log(`✅ Published! FB Post ID: ${externalPostId}`);

  // Update DB
  await prisma.socialPost.update({
    where: { id: socialPost.id },
    data: { status: "PUBLISHED", publishedAt: new Date(), externalPostId },
  });

  // ── 6. Fetch analytics from Facebook Graph API ────────────────────────────
  console.log("\n📊 Fetching analytics (waiting 3s for FB to register the post)...");
  await new Promise(r => setTimeout(r, 3000));

  let likes = 0, comments = 0, shares = 0, reach = 0, impressions = 0;

  try {
    // Reactions (likes)
    const reactions = await axios.get(`${GRAPH}/${externalPostId}`, {
      params: { fields: "reactions.summary(true),comments.summary(true),shares", access_token: pageToken },
    });
    likes = reactions.data.reactions?.summary?.total_count ?? 0;
    comments = reactions.data.comments?.summary?.total_count ?? 0;
    shares = reactions.data.shares?.count ?? 0;
    console.log(`  Reactions: ${likes} | Comments: ${comments} | Shares: ${shares}`);
  } catch (e: any) {
    console.log("  Could not fetch post engagement:", e.response?.data?.error?.message ?? e.message);
  }

  try {
    // Page post insights (reach, impressions) — requires page token
    const insights = await axios.get(`${GRAPH}/${externalPostId}/insights`, {
      params: {
        metric: "post_impressions,post_impressions_unique",
        access_token: pageToken,
      },
    });
    const data: any[] = insights.data.data ?? [];
    reach = data.find((d: any) => d.name === "post_impressions_unique")?.values?.[0]?.value ?? 0;
    impressions = data.find((d: any) => d.name === "post_impressions")?.values?.[0]?.value ?? 0;
    console.log(`  Reach: ${reach} | Impressions: ${impressions}`);
  } catch (e: any) {
    console.log("  Could not fetch insights:", e.response?.data?.error?.message ?? e.message);
  }

  // ── 7. Save analytics snapshot ────────────────────────────────────────────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.socialPostAnalytics.upsert({
    where: { socialPostId_snapshotDate: { socialPostId: socialPost.id, snapshotDate: today } },
    create: {
      socialPostId: socialPost.id,
      snapshotDate: today,
      platform: "FACEBOOK",
      likes, shares, comments, reach, impressions,
      rawData: { externalPostId },
    },
    update: { likes, shares, comments, reach, impressions },
  });

  console.log(`\n✅ Analytics snapshot saved to DB for post ${socialPost.id}`);
  console.log("\n── FULL LOOP COMPLETE ──────────────────────────────────────────");
  console.log(`  Article : "${(article as any).title?.slice(0, 70)}"`);
  console.log(`  FB Post : https://www.facebook.com/${externalPostId.replace("_", "/posts/")}`);
  console.log(`  Stats   : 👍 ${likes}  💬 ${comments}  🔁 ${shares}  👁 ${reach} reach`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
