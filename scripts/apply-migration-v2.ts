import { prisma } from '../lib/prisma';

async function applyMigration() {
  try {
    console.log('Starting migration...\n');
    
    // 1. Create ReviewStatus enum
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected', 'hidden')
      `);
      console.log('✓ Created ReviewStatus enum');
    } catch (error: any) {
      if (error.code === '42710') {
        console.log('⊙ ReviewStatus enum already exists');
      } else {
        console.error('✗ Error creating enum:', error.message);
      }
    }
    
    // 2. Add user fields
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_reason" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_at" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_by" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMP(3)`);
    console.log('✓ Added user fields');
    
    // 3. Add user blocked_by foreign key
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD CONSTRAINT "users_blocked_by_fkey" 
          FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Added users.blocked_by foreign key');
    } catch (error: any) {
      if (error.code === '42710' || error.code === '23505') {
        console.log('⊙ users.blocked_by foreign key already exists');
      } else {
        console.error('✗ Error adding FK:', error.message);
      }
    }
    
    // 4. Add promocode fields
    await prisma.$executeRawUnsafe(`ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "name" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "description" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "max_discount_amount" DECIMAL(10,2)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "uses_per_customer" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "first_order_only" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    console.log('✓ Added promocode fields');
    
    // 5. Create promocode_usages table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "promocode_usages" (
          "id" TEXT NOT NULL,
          "promocode_id" TEXT NOT NULL,
          "user_id" TEXT,
          "order_id" TEXT NOT NULL,
          "discount_amount" DECIMAL(10,2) NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "promocode_usages_pkey" PRIMARY KEY ("id")
        )
      `);
      console.log('✓ Created promocode_usages table');
    } catch (error: any) {
      if (error.code === '42P07') {
        console.log('⊙ promocode_usages table already exists');
      } else {
        console.error('✗ Error creating table:', error.message);
      }
    }
    
    // 6. Add promocode_usages foreign key
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "promocode_usages" ADD CONSTRAINT "promocode_usages_promocode_id_fkey" 
          FOREIGN KEY ("promocode_id") REFERENCES "promocodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('✓ Added promocode_usages foreign key');
    } catch (error: any) {
      if (error.code === '42710' || error.code === '23505') {
        console.log('⊙ promocode_usages foreign key already exists');
      } else {
        console.error('✗ Error adding FK:', error.message);
      }
    }
    
    // 7. Add review fields
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "status" "ReviewStatus" NOT NULL DEFAULT 'pending'`);
      console.log('✓ Added review status field');
    } catch (error: any) {
      if (error.code === '42701') {
        console.log('⊙ review status field already exists');
      } else {
        console.error('✗ Error adding status:', error.message);
      }
    }
    
    await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "moderated_by" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "moderated_at" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT`);
    console.log('✓ Added review moderation fields');
    
    // 8. Add review moderated_by foreign key
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_fkey" 
          FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Added reviews.moderated_by foreign key');
    } catch (error: any) {
      if (error.code === '42710' || error.code === '23505') {
        console.log('⊙ reviews.moderated_by foreign key already exists');
      } else {
        console.error('✗ Error adding FK:', error.message);
      }
    }
    
    // 9. Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "users_last_seen_at_idx" ON "users"("last_seen_at")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "users_is_blocked_idx" ON "users"("is_blocked")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "promocodes_is_active_idx" ON "promocodes"("is_active")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "promocodes_valid_from_valid_until_idx" ON "promocodes"("valid_from", "valid_until")`);
    
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reviews_is_published_idx" ON "reviews"("is_published")`);
      console.log('✓ Created review indexes');
    } catch (error: any) {
      console.log('⊙ Some indexes already exist');
    }
    
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "promocode_usages_promocode_id_idx" ON "promocode_usages"("promocode_id")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "promocode_usages_user_id_idx" ON "promocode_usages"("user_id")`);
      console.log('✓ Created promocode_usages indexes');
    } catch (error: any) {
      console.log('⊙ promocode_usages indexes already exist or table not ready');
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
