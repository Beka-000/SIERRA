import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  try {
    const sqlPath = path.join(__dirname, '../prisma/migrations/001_add_clients_promocodes_reviews_features.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Applying ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✓ Executed: ${statement.substring(0, 60)}...`);
      } catch (error: any) {
        if (error.code === '42710' || error.message.includes('already exists')) {
          console.log(`⊙ Skipped (already exists): ${statement.substring(0, 60)}...`);
        } else if (error.code === '42701' || error.message.includes('column') && error.message.includes('already exists')) {
          console.log(`⊙ Skipped (column exists): ${statement.substring(0, 60)}...`);
        } else {
          console.error(`✗ Error: ${error.message}`);
          console.error(`  Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('\n✓ Migration completed!');
    
    // Regenerate Prisma Client
    console.log('\nRegenerating Prisma Client...');
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
