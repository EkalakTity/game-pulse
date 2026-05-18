# Development Roadmap — GamePulse Hub

## Phase 1 — Foundation (Weeks 1–6)

### Week 1 — Project Bootstrap
**Goal:** Working dev environment, DB connected, auth working.

- [ ] Initialize Turborepo monorepo (`apps/web`, `apps/worker`, `packages/*`)
- [ ] Configure TypeScript strict mode across all packages
- [ ] Set up Prisma with PostgreSQL — initial schema migration
- [ ] Configure NextAuth.js with Credentials provider (email + bcrypt)
- [ ] Admin login page + JWT session
- [ ] Docker Compose: postgres + redis + bull-board
- [ ] Environment variable schema validation (Zod + `packages/config`)
- [ ] Health endpoint (`GET /api/health`)
- [ ] CI pipeline: lint + typecheck + prisma validate

**Deliverable:** Admin can log in. DB is connected. Docker Compose starts all services.

---

### Week 2 — Feed Source Management
**Goal:** Admin can add/edit/delete RSS feed sources.

- [ ] Prisma models: `FeedSource`
- [ ] Repository: `FeedRepository`
- [ ] Service: `FeedService` (CRUD + status toggling)
- [ ] API routes: `GET/POST /api/v1/feeds`, `GET/PATCH/DELETE /api/v1/feeds/:id`
- [ ] Zod validators for feed request bodies
- [ ] UI: Feed Sources list page (DataTable with health badge)
- [ ] UI: Add/Edit feed form (modal)
- [ ] UI: Pause/Resume/Delete actions with confirmation dialog

**Deliverable:** Admin can manage feed sources via UI.

---

### Week 3 — RSS Ingestion Pipeline
**Goal:** System automatically fetches and stores articles from configured feeds.

- [ ] BullMQ setup in `apps/worker` — queue connections, worker scaffold
- [ ] `FeedParser` processor (rss-parser, axios)
- [ ] `DuplicateDetector` (SHA-256 hash, `duplicate_hashes` table)
- [ ] `IngestWorker` — orchestrates fetch → dedup → store
- [ ] `CronScheduler` — triggers `FETCH_FEED` jobs on configured intervals
- [ ] Article repository: `ArticleRepository` with bulk upsert
- [ ] `POST /api/v1/feeds/:id/refresh` — manual trigger endpoint
- [ ] Job logging to `job_logs` table
- [ ] Bull Board UI accessible at `/admin/queues`

**Deliverable:** System ingests articles on schedule. Manual refresh works. Duplicates are skipped.

---

### Week 4 — Article Management & Categories
**Goal:** Admin can browse, filter, and categorize ingested articles.

- [ ] Prisma models: `Category`, `ArticleCategory`
- [ ] Category CRUD API + UI (color picker, keyword list editor)
- [ ] `CategoryClassifier` — keyword matching on ingest
- [ ] Articles list page: paginated DataTable with multi-filter bar
  - Filter by: source, category, status, date range, search
- [ ] Article detail page: full content, thumbnail, categories, source
- [ ] Bulk operations: categorize, archive, mark duplicate
- [ ] Duplicate badge + article merge/link UI

**Deliverable:** Admin can browse and organize all ingested articles.

---

### Week 5 — Media Extraction & Thumbnail System
**Goal:** Every article has a usable thumbnail image.

- [ ] `ThumbnailExtractor` processor — og:image from article URL
- [ ] `MediaWorker` — downloads og:image, uploads to Cloudinary
- [ ] Media model + `MediaRepository`
- [ ] `POST /api/v1/media` — manual media upload endpoint
- [ ] Thumbnail display in article list + detail
- [ ] Fallback: source logo if no og:image found
- [ ] Cloudinary transform URL helpers (resize to platform-specific sizes)

**Deliverable:** Articles display thumbnails. Operator can upload custom images.

---

### Week 6 — Social Publishing & Scheduling
**Goal:** Admin can compose posts and publish/schedule to social platforms.

- [ ] Social account connection UI + encrypted token storage
- [ ] Platform adapters: `FacebookAdapter`, `InstagramAdapter`, `TikTokAdapter`, `LineOAAdapter`
- [ ] `SocialPublisherService` — selects adapter, calls publish, handles errors
- [ ] `PublishWorker` — dequeues publish jobs, calls service, logs result
- [ ] `ScheduleWorker` — promotes scheduled posts to publish queue at due time
- [ ] Social post composer UI:
  - Article picker
  - Platform selector (multi-select)
  - Caption editor with per-platform char count
  - Hashtag input
  - Image preview
  - "Post Now" / "Schedule" buttons
- [ ] Schedule Calendar UI — month/week view, drag-to-reschedule
- [ ] Social posts list: status badges, retry failed, cancel scheduled

**Deliverable:** Admin can publish or schedule posts to all 4 platforms from one composer.

---

## Phase 1 — QA & Hardening (Week 7)

- [ ] End-to-end happy path tests (Playwright)
- [ ] API integration tests (vitest + testcontainers)
- [ ] Repository unit tests (mock Prisma client)
- [ ] Error boundary UI for all async pages
- [ ] Rate limiting on all API routes
- [ ] Production Docker builds optimized (multi-stage, non-root user)
- [ ] Vercel deployment configuration
- [ ] README + developer onboarding docs
- [ ] Security review: token encryption, CSP headers, RBAC audit

---

## Phase 2 — AI Enhancement (Weeks 8–12)

### Week 8–9 — AI Content Processing
- [ ] AI Caption Generator — Claude API: generate platform-specific captions from article title + summary
- [ ] AI Hashtag Generator — relevant gaming hashtags from article content
- [ ] Queue AI processing as async job (`ai-process-queue`)
- [ ] Store results in `articles.ai_caption`, `articles.ai_hashtags`
- [ ] Toggle in composer: "Use AI suggestion" vs manual

### Week 10 — Trending Detection
- [ ] Track article view/publish frequency by category
- [ ] Trending score algorithm (recency × frequency weighted)
- [ ] Dashboard widget: Trending topics (last 24h / 7d)
- [ ] Alert if a topic surges > 2x baseline

### Week 11 — Analytics Foundation
- [ ] Social post performance tracking (likes, shares, reach via platform APIs)
- [ ] Store analytics in `social_post_analytics` table (daily snapshot)
- [ ] Analytics dashboard: engagement per platform, top-performing articles
- [ ] CSV export

### Week 12 — Notification System
- [ ] In-app notifications (failed jobs, token expiry warnings, high engagement)
- [ ] Email notifications for critical failures (Resend API)
- [ ] Notification center UI in TopNav

---

## Phase 3 — Scale & Automation (Weeks 13+)

| Feature | Notes |
|---|---|
| Auto short-video generation | ffmpeg + article images → TikTok-ready clips |
| Queue workers horizontal scale | Docker Swarm or K8s worker replicas |
| Multi-language content | i18next + AI translation per region |
| Read replica | For analytics queries to avoid OLTP contention |
| Webhook system | Let external tools subscribe to article events |
| Public API | Expose curated gaming news feed as a service |
| White-label | Multi-tenant support for other gaming sites |

---

## Technology Versions (Locked for Phase 1)

| Package | Version |
|---|---|
| Next.js | 14.x |
| React | 18.x |
| TypeScript | 5.x |
| Prisma | 5.x |
| PostgreSQL | 16.x |
| Redis | 7.x |
| BullMQ | 5.x |
| NextAuth.js | 4.x |
| TailwindCSS | 3.x |
| shadcn/ui | latest |
| Zod | 3.x |
| Pino | 9.x |
| rss-parser | 3.x |
| Cloudinary SDK | 2.x |

---

## Definition of Done (Per Story)

1. Feature works end-to-end in local Docker environment
2. TypeScript compiles with `strict: true` — zero errors
3. Zod validation on all API inputs
4. Error states handled in UI (loading, empty, error)
5. Relevant tests written and passing
6. No `console.log` in production code paths
7. Feature reviewed against design system tokens
