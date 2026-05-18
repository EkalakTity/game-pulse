# Folder Structure — GamePulse Hub

## Monorepo Layout (Turborepo)

```
gamepulse-hub/
│
├── apps/
│   ├── web/                          # Next.js 14 — frontend + API routes
│   └── worker/                       # Standalone BullMQ worker process
│
├── packages/
│   ├── database/                     # Prisma schema, client, migrations
│   ├── types/                        # Shared TypeScript interfaces/enums
│   └── config/                       # Shared runtime config & env validation
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.worker
│   └── docker-compose.yml
│
├── docs/                             # All project documentation
│
├── scripts/
│   ├── seed.ts                       # DB seeding script
│   └── migrate.sh                    # Production migration runner
│
├── .env.example
├── .gitignore
├── turbo.json
├── package.json                      # Root workspace config
└── tsconfig.base.json
```

---

## apps/web — Next.js Application

```
apps/web/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/              # Protected admin area
│   │   │   ├── layout.tsx            # Admin shell layout
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   │
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx          # Article list
│   │   │   │   └── [id]/page.tsx     # Article detail
│   │   │   │
│   │   │   ├── sources/
│   │   │   │   ├── page.tsx          # Feed sources list
│   │   │   │   └── [id]/page.tsx     # Source detail
│   │   │   │
│   │   │   ├── categories/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx          # Calendar + scheduled posts
│   │   │   │
│   │   │   └── social/
│   │   │       ├── page.tsx          # Social posts list
│   │   │       └── compose/page.tsx  # Post composer
│   │   │
│   │   └── api/
│   │       └── v1/
│   │           ├── auth/
│   │           │   ├── [...nextauth]/route.ts
│   │           │   └── me/route.ts
│   │           │
│   │           ├── feeds/
│   │           │   ├── route.ts           # GET list, POST create
│   │           │   ├── [id]/route.ts      # GET, PATCH, DELETE
│   │           │   └── [id]/refresh/route.ts  # POST trigger manual fetch
│   │           │
│   │           ├── articles/
│   │           │   ├── route.ts
│   │           │   ├── [id]/route.ts
│   │           │   └── [id]/duplicate/route.ts
│   │           │
│   │           ├── categories/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           │
│   │           ├── social/
│   │           │   ├── accounts/
│   │           │   │   ├── route.ts
│   │           │   │   └── [id]/route.ts
│   │           │   └── posts/
│   │           │       ├── route.ts
│   │           │       ├── [id]/route.ts
│   │           │       └── [id]/publish/route.ts  # POST manual trigger
│   │           │
│   │           ├── media/
│   │           │   └── route.ts           # POST upload, GET list
│   │           │
│   │           └── health/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components (Button, Input, etc.)
│   │   ├── layout/
│   │   │   ├── AdminShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopNav.tsx
│   │   ├── articles/
│   │   │   ├── ArticleTable.tsx
│   │   │   ├── ArticleCard.tsx
│   │   │   └── ArticleFilters.tsx
│   │   ├── sources/
│   │   │   ├── SourceCard.tsx
│   │   │   ├── SourceForm.tsx
│   │   │   └── SourceHealthBadge.tsx
│   │   ├── social/
│   │   │   ├── PostComposer.tsx
│   │   │   ├── SocialPreview.tsx      # Per-platform preview
│   │   │   └── ScheduleCalendar.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── PageHeader.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/
│   │   ├── api/                      # API client (typed fetch wrappers)
│   │   │   ├── client.ts             # Base fetch with error handling
│   │   │   ├── articles.ts
│   │   │   ├── feeds.ts
│   │   │   └── social.ts
│   │   ├── auth/
│   │   │   ├── authOptions.ts        # NextAuth configuration
│   │   │   └── middleware.ts         # Route protection
│   │   ├── queue/
│   │   │   └── client.ts             # BullMQ connection for API routes
│   │   └── utils/
│   │       ├── cn.ts                 # clsx + twMerge helper
│   │       ├── date.ts               # Date formatting
│   │       └── pagination.ts         # Cursor pagination helpers
│   │
│   ├── server/
│   │   ├── services/
│   │   │   ├── ArticleService.ts
│   │   │   ├── FeedService.ts
│   │   │   ├── CategoryService.ts
│   │   │   ├── MediaService.ts
│   │   │   └── SocialPublisherService.ts
│   │   ├── repositories/
│   │   │   ├── ArticleRepository.ts
│   │   │   ├── FeedRepository.ts
│   │   │   ├── CategoryRepository.ts
│   │   │   ├── SocialPostRepository.ts
│   │   │   └── MediaRepository.ts
│   │   ├── validators/               # Zod schemas matching API contracts
│   │   │   ├── article.schema.ts
│   │   │   ├── feed.schema.ts
│   │   │   ├── social.schema.ts
│   │   │   └── category.schema.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       ├── rateLimit.middleware.ts
│   │       └── errorHandler.ts
│   │
│   └── hooks/                        # Custom React hooks
│       ├── useArticles.ts
│       ├── useFeeds.ts
│       └── useSocialPosts.ts
│
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## apps/worker — Background Worker

```
apps/worker/
│
├── src/
│   ├── index.ts                      # Worker entrypoint — starts all workers
│   │
│   ├── workers/
│   │   ├── IngestWorker.ts           # Processes RSS fetch jobs
│   │   ├── PublishWorker.ts          # Processes social publish jobs
│   │   ├── ScheduleWorker.ts         # Moves scheduled → publish queue
│   │   └── MediaWorker.ts            # Downloads + processes thumbnails
│   │
│   ├── processors/                   # Pure logic, no BullMQ dependency
│   │   ├── FeedParser.ts             # rss-parser wrapper
│   │   ├── DuplicateDetector.ts      # Hash-based dedup
│   │   ├── ThumbnailExtractor.ts     # og:image extraction + download
│   │   ├── CategoryClassifier.ts     # Keyword → category mapping
│   │   └── SocialAdapters/           # One adapter per platform
│   │       ├── FacebookAdapter.ts
│   │       ├── InstagramAdapter.ts
│   │       ├── TikTokAdapter.ts
│   │       └── LineOAAdapter.ts
│   │
│   ├── queues/
│   │   └── definitions.ts            # Queue names, job type defs
│   │
│   └── scheduler/
│       └── CronScheduler.ts          # node-cron triggers for feed refresh
│
├── tsconfig.json
└── package.json
```

---

## packages/database

```
packages/database/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── ...
│
├── src/
│   ├── client.ts                     # Singleton Prisma client
│   └── index.ts                      # Re-exports client + generated types
│
└── package.json
```

---

## packages/types

```
packages/types/
│
└── src/
    ├── article.types.ts
    ├── feed.types.ts
    ├── social.types.ts
    ├── category.types.ts
    ├── api.types.ts                  # API response envelope types
    └── index.ts
```

---

## packages/config

```
packages/config/
│
└── src/
    ├── env.ts                        # Zod-validated env schema (shared)
    ├── constants.ts                  # App-wide constants
    └── index.ts
```
