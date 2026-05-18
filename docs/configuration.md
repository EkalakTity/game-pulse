# GamePulse Hub — Concept & Configuration Guide

---

## Concept

GamePulse Hub is a **gaming news aggregation and social media publishing platform** built for gaming media teams and content operators.

The core loop is:

```
RSS Feeds → Ingest & Deduplicate → Categorise → AI Captions → Publish to Social → Track Analytics
```

### What it does

**Aggregation** — Pulls articles automatically from any number of RSS/Atom feeds on configurable intervals (5 min–24 h). Duplicate articles are detected via SHA-256 hash before they ever hit the database.

**Organise** — Articles are auto-tagged with categories using keyword matching. Thumbnails are extracted from `og:image` and uploaded to Cloudinary for CDN delivery.

**Publish** — A post composer lets operators pick an article, write or AI-generate captions per platform (Facebook, Instagram, TikTok, LINE OA), add hashtags, attach images, then either publish immediately or schedule for a future time.

**AI-assisted** — Claude (`claude-opus-4-7`) generates platform-specific captions and hashtags from the article title and summary on demand. It can also translate content into Thai, Japanese, Korean, Chinese, Indonesian, and Vietnamese.

**Analytics** — Tracks daily publish volume, per-platform success rates, top-performing articles, and engagement totals (once platform API keys are configured).

**Trending** — A weighted score algorithm (article frequency × recency + social post volume) surfaces the hottest gaming topics over the last 24 h and 7 d, with surge alerts when a topic grows 2× its baseline.

**Notifications** — In-app bell with real-time badge, plus email via Resend for critical failures (publish errors, expired tokens).

**Public API** — Bearer-token-protected REST endpoints expose the curated article feed to external consumers.

**Webhooks** — Push real-time events (`article.ingested`, `post.published`, etc.) to any HTTP endpoint with HMAC-SHA256 signatures.

**White-label** — Multiple branded tenants can share one deployment, each resolved by subdomain or custom domain.

### Architecture at a glance

```
Browser ──► Next.js 14 (apps/web)
                │  API Routes (/api/v1/*)
                │  Server Components + Client Components
                │
                ▼
         PostgreSQL 16  ◄──── Prisma 5 ORM
                │
                ▼
           Redis 7 (BullMQ queues)
                │
                ▼
         Worker Process (apps/worker)
          ├─ IngestWorker      – fetch & store articles
          ├─ MediaWorker       – download → Cloudinary
          ├─ PublishWorker     – post to social platforms
          ├─ ScheduleWorker    – promote scheduled → queue
          ├─ AIWorker          – Claude captions/hashtags
          ├─ TranslateWorker   – Claude translations
          ├─ VideoWorker       – Cloudinary video generation
          ├─ WebhookWorker     – deliver webhook events
          └─ CronScheduler     – feed refresh + token expiry
```

---

## Environment Variables

All variables live in `apps/web/.env.local` (web) and are also read by the worker.  
A `.env` file at the monorepo root is used for Prisma CLI commands.

---

## Module Configuration

---

### 1. Database (PostgreSQL)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Primary connection string |
| `DATABASE_REPLICA_URL` | Optional read replica — used by Analytics and Trending queries |

```env
DATABASE_URL=postgresql://gamepulse:secret@localhost:5434/gamepulse_db
# DATABASE_REPLICA_URL=postgresql://gamepulse:secret@replica:5434/gamepulse_db
```

**Setup:**
```bash
# Start Docker services
docker compose -f docker-compose.dev.yml up -d

# Run migrations
npx prisma migrate dev --schema=packages/database/prisma/schema.prisma

# Seed default admin user and categories
npx tsx packages/database/prisma/seed.ts
```

Default seed credentials: `admin@gamepulse.local` / `Admin@1234`

---

### 2. Authentication (NextAuth.js)

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Random 32+ character secret for JWT signing |
| `NEXTAUTH_URL` | Full URL of the web app (used in email links and OAuth callbacks) |

```env
NEXTAUTH_SECRET=your-random-secret-min-32-chars
NEXTAUTH_URL=http://localhost:3006
```

**Generate a secret:**
```bash
openssl rand -base64 32
```

Uses Credentials provider (email + bcrypt). No OAuth provider is configured by default — all users are managed directly in the `users` table.

---

### 3. Token Encryption

Social platform access tokens are stored encrypted using AES-256-GCM.

| Variable | Description |
|---|---|
| `TOKEN_ENCRYPTION_KEY` | 64-character hex string (256-bit key) |

```env
TOKEN_ENCRYPTION_KEY=c2d1d535a3f4f50fc1a70b578e0912928092723a37528d337071a450afac189f
```

**Generate:**
```bash
openssl rand -hex 32
```

> **Warning:** Changing this key after accounts are connected will make all stored tokens unreadable. Back up the key securely.

---

### 4. Redis (BullMQ Queues)

| Variable | Description |
|---|---|
| `REDIS_URL` | Redis connection string |

```env
REDIS_URL=redis://localhost:6379
```

Queues in use:

| Queue | Purpose |
|---|---|
| `ingest-queue` | Fetch and store articles from RSS feeds |
| `media-queue` | Download thumbnails and upload to Cloudinary |
| `publish-queue` | Publish social posts via platform APIs |
| `schedule-queue` | Promote scheduled posts when their time arrives |
| `ai-process-queue` | Generate AI captions and hashtags |
| `translate-queue` | Translate articles to other languages |
| `video-queue` | Generate short-form video from thumbnails |
| `webhook-queue` | Deliver webhook events to subscriber URLs |

Queue monitor (Bull Board) runs at `http://localhost:3003/queues` by default.

---

### 5. Cloudinary (Media & Video)

Used for thumbnail storage and short-video generation.

| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloud name from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

**Get credentials:** [console.cloudinary.com](https://console.cloudinary.com) → Settings → API Keys

Thumbnails are stored under `gamepulse/thumbnails/` in your Cloudinary media library.  
Generated videos are stored under `gamepulse/video-sources/`.

---

### 6. AI Content Processing (Anthropic Claude)

Used for caption generation, hashtag suggestions, and article translation.

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | API key from Anthropic console |
| `AI_WORKER_CONCURRENCY` | Parallel AI jobs in the worker (default: 2) |

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
AI_WORKER_CONCURRENCY=2
```

**Get key:** [console.anthropic.com](https://console.anthropic.com) → API Keys

Model used: `claude-opus-4-7` with adaptive thinking.

**What it generates:**
- Platform-specific captions (Facebook up to 63,206 chars; Instagram 2,200; TikTok 2,200; LINE OA 5,000)
- Hashtag lists (up to 30 tags depending on platform)
- Translations in: Thai (`th`), Japanese (`ja`), Korean (`ko`), Traditional Chinese (`zh`), Indonesian (`id`), Vietnamese (`vi`)

If `ANTHROPIC_API_KEY` is not set the AI worker and translate worker start in disabled mode — everything else continues to function.

---

### 7. Email Notifications (Resend)

Used for critical alerts: publish failures and expired/expiring social tokens.

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from Resend dashboard |
| `NOTIFICATION_EMAIL` | Recipient email address for alerts |

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
NOTIFICATION_EMAIL=ops@yourdomain.com
```

**Get key:** [resend.com](https://resend.com) → API Keys

The sender address is `notifications@gamepulse.dev`. Update `apps/worker/src/lib/email.ts` `from` field if you use a different verified domain.

If `RESEND_API_KEY` is not set, in-app notifications still work — only the email delivery is silently skipped.

---

### 8. Social Platform Adapters

Each platform adapter lives in `apps/worker/src/adapters/`. The adapters are stubs until you supply real API credentials. Connect accounts through the UI at **Social → Accounts**.

#### Facebook

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add the **Pages API** product
3. Request permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`
4. Connect a Page via **Social → Accounts → Connect**
5. Enter the Page Access Token when prompted

#### Instagram

1. Use the same Facebook App — add the **Instagram Graph API** product
2. Link your Instagram Business/Creator account to a Facebook Page
3. Request permissions: `instagram_basic`, `instagram_content_publish`
4. Connect via **Social → Accounts → Connect**

#### TikTok

1. Create an app at [developers.tiktok.com](https://developers.tiktok.com)
2. Add the **Content Posting API** scope
3. Complete business verification
4. Connect via **Social → Accounts → Connect**

#### LINE Official Account (LINE OA)

1. Create a LINE OA at [manager.line.biz](https://manager.line.biz)
2. Enable **Messaging API** channel
3. Generate a channel access token
4. Connect via **Social → Accounts → Connect**

---

### 9. Worker Concurrency

Control how many parallel jobs each worker processes. Higher values increase throughput but use more CPU and memory.

| Variable | Default | Description |
|---|---|---|
| `INGEST_WORKER_CONCURRENCY` | `5` | Parallel feed fetch jobs |
| `PUBLISH_WORKER_CONCURRENCY` | `2` | Parallel publish jobs |
| `MEDIA_WORKER_CONCURRENCY` | `10` | Parallel thumbnail download/upload jobs |
| `AI_WORKER_CONCURRENCY` | `2` | Parallel AI processing jobs |

```env
INGEST_WORKER_CONCURRENCY=5
PUBLISH_WORKER_CONCURRENCY=2
MEDIA_WORKER_CONCURRENCY=10
AI_WORKER_CONCURRENCY=2
```

---

### 10. Horizontal Scaling (Worker Replicas)

To run multiple worker instances sharing the same Redis queue:

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.scale.yml up --scale worker=3
```

`docker-compose.scale.yml` divides concurrency across replicas automatically. BullMQ handles job coordination — each job is claimed by exactly one worker.

---

### 11. Webhooks

Configure at **Settings → Webhooks**.

Each webhook subscription has:
- **URL** — your HTTP endpoint (must return 2xx within 10 seconds)
- **Events** — one or more of: `article.ingested`, `article.published`, `post.published`, `post.failed`, `token.expired`
- **Secret** — used to verify the HMAC-SHA256 signature

**Verifying a webhook payload:**
```javascript
const crypto = require("crypto");

function verifySignature(secret, body, timestamp, signature) {
  const expected = "sha256=" +
    crypto.createHmac("sha256", secret)
          .update(`${timestamp}.${body}`)
          .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

// In your handler:
const body = req.rawBody;                          // raw JSON string
const timestamp = req.headers["x-gamepulse-timestamp"];
const signature = req.headers["x-gamepulse-signature"];
const valid = verifySignature(YOUR_SECRET, body, timestamp, signature);
```

Webhooks retry up to 5 times with exponential backoff. After 10 consecutive failures the subscription is auto-disabled.

---

### 12. Public API

Generate keys at **Settings → API Keys**.

Each key is shown **once** at creation time — store it securely.

**Authentication:**
```http
GET /api/public/v1/articles
Authorization: Bearer gpk_xxxxxxxxxxxxxxxxxxxx
```

**Available endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/public/v1/articles` | Paginated list of published articles |
| `GET` | `/api/public/v1/articles/:id` | Single article with translations |
| `GET` | `/api/public/v1/trending` | Top 10 trending categories |

**Query parameters for `/articles`:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Results per page (max 100) |
| `offset` | number | 0 | Pagination offset |
| `category` | string | — | Filter by category slug |

---

### 13. Multi-language Translation

Configure at **Articles → [article] → Translate** or via the API:

```http
POST /api/v1/articles/:id/translate
Content-Type: application/json

{ "locales": ["th", "ja", "ko"] }
```

Supported locales: `th`, `ja`, `ko`, `zh`, `id`, `vi`

Translations are stored in `article_translations` and returned in the Public API response under the `translations` array. Requires `ANTHROPIC_API_KEY`.

---

### 14. Short-Video Generation

Trigger per article:

```http
POST /api/v1/articles/:id/generate-video
```

The VideoWorker picks up the job, uploads the article thumbnail to Cloudinary, and applies transformation layers to produce a **9-second 1080×1920 vertical video** (TikTok/Reels format) with:
- Article title overlay
- Dark gradient for text legibility
- "GamePulse Hub" branding at the bottom
- Fade-in and fade-out effects

Requires Cloudinary credentials. The generated video URL is stored in `article_videos.video_url`.

---

### 15. White-label / Multi-tenant

Configure at **Settings → Tenants**.

Each tenant has:
- **Slug** — used for subdomain routing (`acme.gamepulse.app`)
- **Custom domain** — set your DNS A/CNAME to point to the server, then enter the domain here
- **Primary & accent colours** — brand colours applied to the UI
- **Logo URL** — displayed in the sidebar instead of the default wordmark

**Resolution order:**
1. `X-Tenant-Slug` request header (for reverse-proxy routing)
2. Subdomain: `{slug}.gamepulse.app` or `{slug}.localhost`
3. Exact custom domain match

If no tenant resolves, the app operates in single-tenant (default) mode.

---

### 16. Development Server

```bash
# Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# Run web app
cd apps/web && npm run dev -- -p 3006

# Run worker (in a separate terminal)
cd apps/worker && npm run dev

# Run tests
cd apps/worker && npm test
cd apps/web && npm test
```

Default URLs:

| Service | URL |
|---|---|
| Web app | http://localhost:3006 |
| Bull Board (queue monitor) | http://localhost:3003/queues |
| PostgreSQL | localhost:5434 |
| Redis | localhost:6379 |

---

### 17. Production Deployment

**Web (Vercel):**
```bash
cd apps/web && vercel deploy
```

Set all environment variables in the Vercel project dashboard under Settings → Environment Variables.

**Worker (Docker):**
```bash
docker build -f docker/Dockerfile.worker -t gamepulse-worker .
docker run -d --env-file .env.worker gamepulse-worker
```

For horizontal scaling use `docker-compose.scale.yml` or deploy with Kubernetes — each worker replica connects to the same Redis and PostgreSQL instance.

---

## Quick-start Checklist

- [ ] Copy `.env.local.example` to `apps/web/.env.local` and fill in values
- [ ] Generate `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- [ ] Generate `TOKEN_ENCRYPTION_KEY` — `openssl rand -hex 32`
- [ ] Start Docker: `docker compose -f docker-compose.dev.yml up -d`
- [ ] Run migrations: `npx prisma migrate dev --schema=packages/database/prisma/schema.prisma`
- [ ] Seed: `npx tsx packages/database/prisma/seed.ts`
- [ ] Add Cloudinary credentials
- [ ] Add Anthropic API key (optional — enables AI features)
- [ ] Add Resend key + notification email (optional — enables email alerts)
- [ ] Start web: `cd apps/web && npm run dev -- -p 3006`
- [ ] Start worker: `cd apps/worker && npm run dev`
- [ ] Log in at http://localhost:3006 with `admin@gamepulse.local` / `Admin@1234`
- [ ] Add at least one RSS feed source under **Feed Sources**
- [ ] Connect a social account under **Social → Accounts**
