# Database Schema — GamePulse Hub

## Prisma Schema

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────

enum UserRole {
  ADMIN
  EDITOR
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  name         String
  passwordHash String     @map("password_hash")
  role         UserRole   @default(EDITOR)
  isActive     Boolean    @default(true) @map("is_active")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  socialPosts  SocialPost[]

  @@map("users")
}

// ─────────────────────────────────────────────────────────
// RSS FEED SOURCES
// ─────────────────────────────────────────────────────────

enum FeedStatus {
  ACTIVE
  PAUSED
  ERROR
}

model FeedSource {
  id              String      @id @default(cuid())
  name            String
  url             String      @unique
  description     String?
  logoUrl         String?     @map("logo_url")
  status          FeedStatus  @default(ACTIVE)
  fetchIntervalMin Int        @default(15) @map("fetch_interval_min")
  lastFetchedAt   DateTime?   @map("last_fetched_at")
  lastErrorAt     DateTime?   @map("last_error_at")
  lastError       String?     @map("last_error")
  articleCount    Int         @default(0) @map("article_count")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  articles        Article[]

  @@map("feed_sources")
}

// ─────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  color       String    @default("#6d28d9")  // hex color for UI
  keywords    String[]  // keyword matching for auto-classification
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  articles    ArticleCategory[]

  @@map("categories")
}

// ─────────────────────────────────────────────────────────
// ARTICLES
// ─────────────────────────────────────────────────────────

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DUPLICATE
}

model Article {
  id              String        @id @default(cuid())
  externalId      String?       @map("external_id")  // GUID from RSS
  title           String
  summary         String?       @db.Text
  content         String?       @db.Text
  url             String        @unique
  author          String?
  publishedAt     DateTime?     @map("published_at")
  status          ArticleStatus @default(DRAFT)
  contentHash     String        @map("content_hash")  // SHA-256 for dedup

  // Media
  thumbnailUrl    String?       @map("thumbnail_url")
  thumbnailPath   String?       @map("thumbnail_path")  // local/cdn path

  // Relations
  sourceId        String        @map("source_id")
  source          FeedSource    @relation(fields: [sourceId], references: [id])
  categories      ArticleCategory[]
  socialPosts     SocialPost[]
  media           Media[]

  // AI future fields
  aiSummary       String?       @map("ai_summary") @db.Text
  aiHashtags      String[]      @map("ai_hashtags")
  aiCaption       Json?         @map("ai_caption")    // { fb, ig, tiktok, line }
  aiProcessedAt   DateTime?     @map("ai_processed_at")

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@index([contentHash])
  @@index([sourceId])
  @@index([status])
  @@index([publishedAt])
  @@map("articles")
}

model ArticleCategory {
  articleId    String   @map("article_id")
  categoryId   String   @map("category_id")
  article      Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  category     Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([articleId, categoryId])
  @@map("article_categories")
}

// ─────────────────────────────────────────────────────────
// DUPLICATE DETECTION
// ─────────────────────────────────────────────────────────

model DuplicateHash {
  hash       String   @id         // SHA-256(title + url)
  articleId  String   @unique @map("article_id")
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("duplicate_hashes")
}

// ─────────────────────────────────────────────────────────
// MEDIA
// ─────────────────────────────────────────────────────────

enum MediaType {
  IMAGE
  VIDEO
  THUMBNAIL
}

model Media {
  id          String    @id @default(cuid())
  filename    String
  originalUrl String?   @map("original_url")
  storedUrl   String    @map("stored_url")   // CDN/Cloudinary URL
  storedPath  String?   @map("stored_path")
  mimeType    String    @map("mime_type")
  size        Int?      // bytes
  width       Int?
  height      Int?
  type        MediaType @default(IMAGE)

  articleId   String?   @map("article_id")
  article     Article?  @relation(fields: [articleId], references: [id])

  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("media")
}

// ─────────────────────────────────────────────────────────
// SOCIAL ACCOUNTS
// ─────────────────────────────────────────────────────────

enum SocialPlatform {
  FACEBOOK
  INSTAGRAM
  TIKTOK
  LINE_OA
}

model SocialAccount {
  id               String         @id @default(cuid())
  platform         SocialPlatform
  accountName      String         @map("account_name")
  accountId        String         @map("account_id")  // Platform user/page ID
  accessToken      String         @map("access_token")      // AES-256 encrypted
  refreshToken     String?        @map("refresh_token")     // AES-256 encrypted
  tokenExpiresAt   DateTime?      @map("token_expires_at")
  isActive         Boolean        @default(true) @map("is_active")
  metadata         Json?          // Platform-specific extra data
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")

  socialPosts      SocialPost[]

  @@unique([platform, accountId])
  @@map("social_accounts")
}

// ─────────────────────────────────────────────────────────
// SOCIAL POSTS
// ─────────────────────────────────────────────────────────

enum PostStatus {
  DRAFT
  SCHEDULED
  QUEUED
  PUBLISHED
  FAILED
  CANCELLED
}

model SocialPost {
  id              String         @id @default(cuid())
  caption         String?        @db.Text
  hashtags        String[]
  mediaUrls       String[]       @map("media_urls")
  scheduledAt     DateTime?      @map("scheduled_at")
  publishedAt     DateTime?      @map("published_at")
  status          PostStatus     @default(DRAFT)
  externalPostId  String?        @map("external_post_id")  // Platform post ID after publish
  failureReason   String?        @map("failure_reason")
  retryCount      Int            @default(0) @map("retry_count")

  // Relations
  articleId       String?        @map("article_id")
  article         Article?       @relation(fields: [articleId], references: [id])
  accountId       String         @map("account_id")
  account         SocialAccount  @relation(fields: [accountId], references: [id])
  createdById     String         @map("created_by_id")
  createdBy       User           @relation(fields: [createdById], references: [id])

  jobLogs         JobLog[]

  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  @@index([status])
  @@index([scheduledAt])
  @@index([accountId])
  @@map("social_posts")
}

// ─────────────────────────────────────────────────────────
// JOB AUDIT LOG
// ─────────────────────────────────────────────────────────

enum JobType {
  FEED_INGEST
  SOCIAL_PUBLISH
  MEDIA_DOWNLOAD
  SCHEDULE_CHECK
}

enum JobResult {
  SUCCESS
  FAILURE
  PARTIAL
}

model JobLog {
  id           String     @id @default(cuid())
  jobType      JobType    @map("job_type")
  jobId        String?    @map("job_id")       // BullMQ job ID
  result       JobResult
  message      String?    @db.Text
  durationMs   Int?       @map("duration_ms")
  metadata     Json?

  // Optional relations
  feedSourceId String?    @map("feed_source_id")
  socialPostId String?    @map("social_post_id")
  socialPost   SocialPost? @relation(fields: [socialPostId], references: [id])

  createdAt    DateTime   @default(now()) @map("created_at")

  @@index([jobType])
  @@index([result])
  @@index([createdAt])
  @@map("job_logs")
}
```

---

## Key Indexes

| Table | Index | Reason |
|---|---|---|
| `articles` | `content_hash` | O(1) duplicate lookup |
| `articles` | `source_id` | Feed → articles join |
| `articles` | `status` | Filter by draft/published |
| `articles` | `published_at` | Time-range queries |
| `social_posts` | `status` | Queue polling |
| `social_posts` | `scheduled_at` | Scheduler scan |
| `job_logs` | `created_at` | Recent activity queries |

---

## Deduplication Strategy

```
content_hash = SHA256(
  normalize(article.title) +         // lowercase + trim whitespace
  normalize(article.url)             // strip UTM params, trailing slash
)
```

On ingest: check `duplicate_hashes` before insert. If found, mark article as `DUPLICATE` and skip. The hash table is indexed by primary key for O(1) lookup at scale.

---

## Encryption for Social Tokens

```ts
// AES-256-GCM encryption before storage
const encrypted = encrypt(accessToken, process.env.TOKEN_ENCRYPTION_KEY);
// stored as: `iv:authTag:ciphertext` (base64 joined)
```

Tokens are decrypted in-memory in the worker process only, never returned to the API caller.

---

## Entity Relationship Summary

```
FeedSource  ──< Article >── ArticleCategory >── Category
                  │
                  ├──< Media
                  │
                  └──< SocialPost >── SocialAccount
                         │
                         └──< JobLog

User ──────────< SocialPost

DuplicateHash (standalone, keyed by hash)
```
