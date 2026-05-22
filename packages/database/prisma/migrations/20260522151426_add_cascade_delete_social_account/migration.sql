-- DropForeignKey
ALTER TABLE "social_posts" DROP CONSTRAINT "social_posts_account_id_fkey";

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
