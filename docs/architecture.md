# System Architecture — GamePulse Hub

## Overview

GamePulse Hub is a monorepo containing two applications and three shared packages.
Phase 1 is a **modular monolith** — single deployment unit with clean module
boundaries that can be extracted into microservices in phase 2 without interface changes.

---

## High-Level Architecture Diagram

```
                          ┌─────────────────────────────────────┐
                          │          External World              │
                          │                                      │
                          │  RSS Feeds   Social Platforms        │
                          │  (GameSpot,  (Facebook API,          │
                          │   IGN, etc.) TikTok API, IG, LINE)   │
                          └──────┬──────────────┬───────────────┘
                                 │              │
                  ┌──────────────▼──┐     ┌─────▼────────────────┐
                  │  RSS Ingestion  │     │  Social Publisher     │
                  │  Worker (cron)  │     │  Worker (queue)       │
                  └──────────┬──────┘     └─────┬────────────────┘
                             │                  │
                    ┌────────▼──────────────────▼────────┐
                    │         BullMQ + Redis              │
                    │   (ingest-queue, publish-queue,     │
                    │    schedule-queue, media-queue)     │
                    └────────────────┬───────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │               Next.js Application            │
              │                                             │
              │  ┌──────────────┐    ┌────────────────────┐ │
              │  │  App Router  │    │    API Routes       │ │
              │  │  (Frontend)  │    │  /api/v1/**         │ │
              │  └──────────────┘    └────────────────────┘ │
              └──────────────────────────────────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │                PostgreSQL                    │
              │           (via Prisma ORM)                   │
              │                                             │
              │  users │ feed_sources │ articles │ categories│
              │  social_accounts │ social_posts │ media      │
              │  job_logs │ duplicate_hashes                 │
              └──────────────────────────────────────────────┘
                          │
              ┌───────────▼──────────┐
              │   Redis              │
              │   - BullMQ queues    │
              │   - Session cache    │
              │   - Rate limit       │
              └──────────────────────┘
```

---

## Application Layers

### Layer 1 — Presentation (Next.js App Router)
- React Server Components for data-fetch-heavy pages
- Client Components for interactive widgets
- SWR for client-side data fetching with stale-while-revalidate
- Route-level layouts for the admin shell

### Layer 2 — API (Next.js Route Handlers)
- RESTful endpoints under `/api/v1/`
- Zod schema validation on every request body and query param
- Typed error responses: `{ success: false, error: { code, message, details } }`
- JWT authentication middleware applied via route group `(protected)`
- Rate limiting: 100 req/min per IP via Redis sliding window

### Layer 3 — Service Layer
- Pure TypeScript classes with no framework dependencies
- One service per bounded context: `ArticleService`, `FeedService`, `PublisherService`
- Services accept repositories via constructor injection (testable without DB)
- All async operations return `Promise<Result<T, AppError>>`

### Layer 4 — Repository Layer
- One repository per Prisma model
- Encapsulates all Prisma calls — no raw Prisma client in services
- Pagination via cursor-based strategy for performance at scale

### Layer 5 — Worker (Standalone Node.js process)
- BullMQ workers: `IngestWorker`, `PublishWorker`, `ScheduleWorker`, `MediaWorker`
- Each worker is a class with `process(job: Job)` method
- Concurrency per queue: configurable via env vars
- Failed jobs move to dead-letter queue, trigger alerts after 3 retries

---

## Data Flow — RSS Ingestion

```
Cron (every 15min)
    │
    ▼
FeedScheduler.enqueueAll()
    │  Reads active FeedSources from DB
    │  Pushes one job per source to ingest-queue
    ▼
IngestWorker.process(job)
    │
    ├─► FeedParser.fetch(url)        — axios + rss-parser
    │       │
    │       ▼
    │   DuplicateDetector.check()    — SHA-256 hash of (title + link)
    │       │                          checked against duplicate_hashes table
    │       ▼
    │   ArticleService.createMany()  — bulk insert with upsert
    │       │
    │       ▼
    │   MediaWorker.enqueue()        — extract og:image, download thumbnail
    │       │
    │       ▼
    │   CategoryClassifier.tag()    — keyword-based in phase 1
    │                                  AI-based in phase 2
    ▼
FeedSource.lastFetchedAt updated
JobLog entry written
```

---

## Data Flow — Social Publishing

```
Admin schedules post (UI)
    │
    ▼
POST /api/v1/social/posts
    │  Creates SocialPost record (status: SCHEDULED)
    │  Enqueues job to schedule-queue with runAt timestamp
    ▼
ScheduleWorker.process(job)
    │  At scheduled time, enqueues to publish-queue
    ▼
PublishWorker.process(job)
    │
    ├─► Facebook: Graph API POST /me/feed
    ├─► Instagram: Graph API POST /me/media (two-step)
    ├─► TikTok: Content Posting API
    └─► LINE OA: Messaging API push message
    │
    ▼
SocialPost.status = PUBLISHED | FAILED
External post IDs stored for analytics
JobLog entry written
```

---

## Security Architecture

| Concern | Solution |
|---|---|
| Authentication | NextAuth.js — HS256 JWT, 24h expiry, refresh via sliding session |
| Authorization | RBAC: ADMIN, EDITOR roles checked in middleware |
| Secret management | Environment variables only — never committed to git |
| SQL injection | Prisma parameterized queries — raw SQL not used |
| XSS | React JSX escaping + CSP headers via Next.js middleware |
| CSRF | SameSite=Lax cookies + Origin header validation |
| Rate limiting | Redis sliding window per IP + per user |
| Social tokens | Encrypted at rest using AES-256 before DB storage |

---

## Scalability Path

### Phase 1 (Current) — Modular Monolith
- Single Next.js app on Vercel
- Single worker process in Docker
- Single PostgreSQL instance
- Redis for queues + cache

### Phase 2 — Service Extraction
- Extract worker into dedicated microservice
- Add read replica for analytics queries
- Add CDN (Cloudflare) in front of media assets
- Horizontal scale worker via Docker Swarm or K8s

### Phase 3 — Platform Scale
- Split services: Ingest Service | Publisher Service | Analytics Service
- Event streaming via Kafka for fan-out
- Separate databases per service
- AI processing service (GPU instance) for caption/video generation

---

## Infrastructure — Docker Compose (Local Dev)

```yaml
services:
  web:       # Next.js (port 3000)
  worker:    # BullMQ worker
  postgres:  # PostgreSQL 16 (port 5432)
  redis:     # Redis 7 (port 6379)
  bull-board: # Queue monitoring UI (port 3001)
```

---

## Observability

- **Structured logging:** Pino — JSON logs with request ID, user ID, duration
- **Request tracing:** `x-request-id` header propagated through all layers
- **Queue monitoring:** Bull Board UI at `/admin/queues`
- **Error tracking:** Sentry (phase 1), OpenTelemetry-compatible (phase 2)
- **Health endpoint:** `GET /api/health` returns DB + Redis + queue status
