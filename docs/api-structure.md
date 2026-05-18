# API Structure — GamePulse Hub

## Conventions

- **Base URL:** `/api/v1`
- **Auth:** `Authorization: Bearer <jwt>` on all protected routes
- **Content-Type:** `application/json`
- **Pagination:** cursor-based via `cursor` + `limit` query params
- **Response envelope:**

```ts
// Success
{ "success": true, "data": T, "meta"?: PaginationMeta }

// Error
{ "success": false, "error": { "code": string, "message": string, "details"?: unknown } }
```

**Error codes:** `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `VALIDATION_ERROR` | `CONFLICT` | `RATE_LIMITED` | `INTERNAL_ERROR`

---

## Authentication

### POST /api/v1/auth/login
Sign in with email + password.

**Request:**
```json
{ "email": "admin@example.com", "password": "secret" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "ADMIN" },
    "token": "eyJ..."
  }
}
```

### GET /api/v1/auth/me
Returns the currently authenticated user.

### POST /api/v1/auth/logout
Invalidates the session.

---

## Feed Sources

### GET /api/v1/feeds
List all feed sources.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `status` | `ACTIVE\|PAUSED\|ERROR` | Filter by status |
| `limit` | number | Items per page (default 20, max 100) |
| `cursor` | string | Pagination cursor |

**Response data:** `FeedSource[]`

### POST /api/v1/feeds
Create a new feed source.

**Request:**
```json
{
  "name": "IGN",
  "url": "https://feeds.ign.com/ign/all",
  "description": "IGN gaming news feed",
  "fetchIntervalMin": 15
}
```

### GET /api/v1/feeds/:id
Get a single feed source with recent article count.

### PATCH /api/v1/feeds/:id
Update feed source (name, url, interval, status).

### DELETE /api/v1/feeds/:id
Soft-delete: sets status to PAUSED, keeps articles.

### POST /api/v1/feeds/:id/refresh
Manually trigger an immediate fetch for this source.
Enqueues a job to ingest-queue and returns `{ jobId: string }`.

---

## Articles

### GET /api/v1/articles
List articles with filtering and pagination.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `status` | ArticleStatus | Filter by status |
| `sourceId` | string | Filter by feed source |
| `categoryId` | string | Filter by category |
| `q` | string | Full-text search on title + summary |
| `from` | ISO date | Published after |
| `to` | ISO date | Published before |
| `limit` | number | Default 20, max 100 |
| `cursor` | string | Pagination cursor |

**Response data:** `Article[]` (with source + categories included)

### GET /api/v1/articles/:id
Full article detail including media and social post history.

### PATCH /api/v1/articles/:id
Update article (status, categories, thumbnail override).

**Request:**
```json
{
  "status": "PUBLISHED",
  "categoryIds": ["cat_abc", "cat_def"],
  "thumbnailUrl": "https://..."
}
```

### DELETE /api/v1/articles/:id
Mark as ARCHIVED (not hard delete).

### POST /api/v1/articles/bulk
Bulk operations on multiple articles.

**Request:**
```json
{
  "ids": ["art_1", "art_2"],
  "action": "ARCHIVE" | "CATEGORIZE" | "SCHEDULE",
  "payload": { "categoryIds": ["cat_1"] }
}
```

### GET /api/v1/articles/:id/duplicate
Check if article has duplicates. Returns `{ isDuplicate: boolean, originalId?: string }`.

---

## Categories

### GET /api/v1/categories
List all categories.

### POST /api/v1/categories
Create category.

**Request:**
```json
{
  "name": "PC Gaming",
  "slug": "pc-gaming",
  "color": "#6d28d9",
  "keywords": ["PC", "Steam", "GPU", "NVIDIA", "AMD"]
}
```

### PATCH /api/v1/categories/:id
Update category.

### DELETE /api/v1/categories/:id
Delete category (unlinks from articles, does not delete articles).

---

## Social Accounts

### GET /api/v1/social/accounts
List connected social accounts.

**Response data:**
```json
[
  {
    "id": "acc_abc",
    "platform": "FACEBOOK",
    "accountName": "GamePulse Page",
    "accountId": "123456789",
    "isActive": true,
    "tokenExpiresAt": "2026-08-01T00:00:00Z"
  }
]
```

### POST /api/v1/social/accounts
Connect a new social account.

**Request:**
```json
{
  "platform": "FACEBOOK",
  "accountName": "GamePulse Page",
  "accountId": "123456789",
  "accessToken": "EAAxxxx",
  "refreshToken": null,
  "tokenExpiresAt": "2026-08-01T00:00:00Z"
}
```
*Token is encrypted before storage.*

### PATCH /api/v1/social/accounts/:id
Update account (name, token refresh, isActive toggle).

### DELETE /api/v1/social/accounts/:id
Disconnect account. Cancels all pending scheduled posts for this account.

---

## Social Posts

### GET /api/v1/social/posts
List social posts.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `status` | PostStatus | Filter by status |
| `platform` | SocialPlatform | Filter by platform |
| `accountId` | string | Filter by account |
| `from` | ISO date | Scheduled after |
| `to` | ISO date | Scheduled before |
| `limit` | number | Default 20 |
| `cursor` | string | Pagination cursor |

### POST /api/v1/social/posts
Create a new social post (draft or scheduled).

**Request:**
```json
{
  "articleId": "art_abc",
  "accountId": "acc_abc",
  "caption": "🎮 Check out the latest gaming news!",
  "hashtags": ["#gaming", "#PCGaming"],
  "mediaUrls": ["https://cdn.example.com/thumb.jpg"],
  "scheduledAt": "2026-05-18T09:00:00Z"
}
```

**Behavior:**
- If `scheduledAt` is provided → status = `SCHEDULED`, job enqueued with delay
- If `scheduledAt` is null → status = `DRAFT`

### GET /api/v1/social/posts/:id
Get post detail including job logs.

### PATCH /api/v1/social/posts/:id
Update post (only if status is `DRAFT` or `SCHEDULED`).

### DELETE /api/v1/social/posts/:id
Cancel post. Removes job from queue if scheduled.

### POST /api/v1/social/posts/:id/publish
Manually trigger immediate publish for a DRAFT or SCHEDULED post.
Moves to publish-queue, returns `{ jobId: string }`.

---

## Media

### POST /api/v1/media
Upload media file for use in social posts.

**Request:** `multipart/form-data` with `file` field.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "med_abc",
    "storedUrl": "https://res.cloudinary.com/...",
    "width": 1200,
    "height": 630,
    "mimeType": "image/jpeg"
  }
}
```

### GET /api/v1/media
List uploaded media files.

---

## Health

### GET /api/health
System health check. No auth required.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T12:00:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "queues": {
      "ingest": { "waiting": 2, "active": 1, "failed": 0 },
      "publish": { "waiting": 0, "active": 0, "failed": 1 }
    }
  }
}
```

---

## Queue Jobs API (Internal — Worker → DB)

These are not exposed to clients. Workers communicate via BullMQ jobs.

| Queue | Job Type | Payload |
|---|---|---|
| `ingest-queue` | `FETCH_FEED` | `{ feedSourceId: string }` |
| `media-queue` | `DOWNLOAD_THUMBNAIL` | `{ articleId: string, imageUrl: string }` |
| `schedule-queue` | `PROMOTE_SCHEDULED` | `{ socialPostId: string }` |
| `publish-queue` | `PUBLISH_POST` | `{ socialPostId: string }` |

---

## API Rate Limits

| Endpoint Group | Limit |
|---|---|
| Auth endpoints | 10 req/min per IP |
| Read endpoints (GET) | 200 req/min per user |
| Write endpoints (POST/PATCH/DELETE) | 60 req/min per user |
| Publish trigger | 10 req/min per user |
| Media upload | 20 req/min per user |
