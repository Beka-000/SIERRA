/**
 * Проверка администратора в базе данных
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

  try {
    const result = await client.query(
      `
      SELECT 
        u.id,
        u.email,
        u.name,
        r.code as role_code,
        r.title as role_title
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
      `,
      ["kojomkulov2004@gmail.com"]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("\n✓ Пользователь найден:");
      console.log(`  Email: ${user.email}`);
      console.log(`  Имя: ${user.name}`);
      console.log(`  Роль: ${user.role_title} (${user.role_code})`);
      console.log(`  ID: ${user.id}\n`);
    } else {
      console.log("\n❌ Пользователь не найден\n");
    }
  } finally {
    await client.end();
  }
}

main().catch(console.error);
