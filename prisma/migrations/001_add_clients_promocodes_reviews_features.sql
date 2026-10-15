-- Add ReviewStatus enum
DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected', 'hidden');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_reason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_by" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMP(3);

-- Add foreign key for blockedBy (only if not exists)
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_blocked_by_fkey" 
    FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add fields to promocodes table
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "max_discount_amount" DECIMAL(10,2);
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "uses_per_customer" INTEGER;
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "first_order_only" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create promocode_usages table
CREATE TABLE IF NOT EXISTS "promocode_usages" (
    "id" TEXT NOT NULL,
    "promocode_id" TEXT NOT NULL,
    "user_id" TEXT,
    "order_id" TEXT NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promocode_usages_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for promocode_usages (only if not exists)
DO $$ BEGIN
  ALTER TABLE "promocode_usages" ADD CONSTRAINT "promocode_usages_promocode_id_fkey" 
    FOREIGN KEY ("promocode_id") REFERENCES "promocodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add fields to reviews table
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "status" "ReviewStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "moderated_by" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "moderated_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- Add foreign key for moderatedBy (only if not exists)
DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_fkey" 
    FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "users_last_seen_at_idx" ON "users"("last_seen_at");
CREATE INDEX IF NOT EXISTS "users_is_blocked_idx" ON "users"("is_blocked");
CREATE INDEX IF NOT EXISTS "promocodes_is_active_idx" ON "promocodes"("is_active");
CREATE INDEX IF NOT EXISTS "promocodes_valid_from_valid_until_idx" ON "promocodes"("valid_from", "valid_until");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");
CREATE INDEX IF NOT EXISTS "reviews_is_published_idx" ON "reviews"("is_published");
CREATE INDEX IF NOT EXISTS "promocode_usages_promocode_id_idx" ON "promocode_usages"("promocode_id");
CREATE INDEX IF NOT EXISTS "promocode_usages_user_id_idx" ON "promocode_usages"("user_id");
