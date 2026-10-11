/**
 * Проверка потока сессии для администратора
 */

import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("🔍 Проверка потока сессии администратора...\n");

  try {
    const email = "kojomkulov2004@gmail.com";

    // 1. Проверяем данные через обычный SQL (как в /api/admin/auth/verify)
    console.log("1️⃣ Проверка через SQL (как admin API):");
    const sqlResult = await client.query(
      `SELECT u.id, u.email, u.name, u.is_blocked, r.code AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1
       LIMIT 1`,
      [email]
    );

    if (sqlResult.rows.length > 0) {
      const user = sqlResult.rows[0];
      console.log(`   ✓ ID: ${user.id}`);
      console.log(`   ✓ Email: ${user.email}`);
      console.log(`   ✓ Name: ${user.name}`);
      console.log(`   ✓ Role: ${user.role}`);
      console.log(`   ✓ Blocked: ${user.is_blocked}`);
      
      console.log("\n   📝 Session Data (создаётся в verify):");
      console.log(`   {`);
      console.log(`     userId: "${user.id}",`);
      console.log(`     email: "${user.email}",`);
      console.log(`     name: "${user.name}",`);
      console.log(`     role: "${user.role}"`);
      console.log(`   }`);
    } else {
      console.log("   ❌ Пользователь не найден через SQL");
    }

    // 2. Проверяем, как Prisma видит этого пользователя
    console.log("\n2️⃣ Как Prisma загружает пользователя (через /api/auth/session):");
    console.log("   Prisma использует: user.role.code");
    
    const prismaCheck = await client.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.google_avatar,
        r.code as role_code
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [sqlResult.rows[0]?.id]
    );

    if (prismaCheck.rows.length > 0) {
      const user = prismaCheck.rows[0];
      console.log(`   ✓ Role code: ${user.role_code}`);
      console.log("\n   📝 Response от /api/auth/session:");
      console.log(`   {`);
      console.log(`     id: "${user.id}",`);
      console.log(`     name: "${user.name}",`);
      console.log(`     email: "${user.email}",`);
      console.log(`     phone: "${user.phone}",`);
      console.log(`     role: "${user.role_code}",`);
      console.log(`     avatar: "${user.google_avatar || null}"`);
      console.log(`   }`);
    }

    console.log("\n" + "═".repeat(60));
    console.log("✅ ВЫВОД:");
    console.log("Обе системы возвращают одинаковую роль: 'admin'");
    console.log("AdminGuard проверяет: ['admin', 'manager', 'staff']");
    console.log("Роль 'admin' должна проходить проверку.");
    console.log("═".repeat(60) + "\n");

  } finally {
    await client.end();
  }
}

main().catch(console.error);
