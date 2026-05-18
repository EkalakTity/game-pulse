-- CreateTable
CREATE TABLE "social_post_analytics" (
    "id" TEXT NOT NULL,
    "social_post_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_post_analytics_snapshot_date_idx" ON "social_post_analytics"("snapshot_date");

-- CreateIndex
CREATE INDEX "social_post_analytics_platform_idx" ON "social_post_analytics"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_analytics_social_post_id_snapshot_date_key" ON "social_post_analytics"("social_post_id", "snapshot_date");

-- AddForeignKey
ALTER TABLE "social_post_analytics" ADD CONSTRAINT "social_post_analytics_social_post_id_fkey" FOREIGN KEY ("social_post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
