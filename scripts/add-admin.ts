/**
 * Скрипт добавления администратора
 * Делает существующего пользователя администратором
 *
 * Запуск: npx tsx scripts/add-admin.ts
 */

import { Client } from "pg";
import { hash } from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("🔧 Добавление администратора...\n");

  try {
    // Получаем id роли admin
    const roleRes = await client.query(
      `SELECT id FROM roles WHERE code = 'admin' LIMIT 1`
    );
    
    if (roleRes.rows.length === 0) {
      throw new Error("Роль admin не найдена в базе данных. Сначала запустите: npx tsx scripts/seed.ts");
    }
    
    const adminRoleId = roleRes.rows[0].id;

    // Email и пароль нового администратора
    const email = "kojomkulov2004@gmail.com";
    const password = "admin1234!";
    const passwordHash = await hash(password, 12);

    // Проверяем, существует ли пользователь
    const userCheck = await client.query(
      `SELECT id, email, role_id FROM users WHERE email = $1`,
      [email]
    );

    if (userCheck.rows.length > 0) {
      // Пользователь существует - обновляем его роль и пароль
      await client.query(
        `
        UPDATE users 
        SET role_id = $1,
            password_hash = $2,
            updated_at = NOW()
        WHERE email = $3
        `,
        [adminRoleId, passwordHash, email]
      );
      console.log("✓ Пользователь обновлён до администратора");
    } else {
      // Пользователь не существует - создаём нового
      await client.query(
        `
        INSERT INTO users (id, role_id, name, email, password_hash, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
        `,
        [adminRoleId, "Admin", email, passwordHash]
      );
      console.log("✓ Новый администратор создан");
    }

    console.log("\n📋 Данные для входа:");
    console.log(`  Email:    ${email}`);
    console.log(`  Пароль:   ${password}`);
    console.log("\n✅ Готово! Теперь можете войти в админку: /admin/login\n");

  } catch (error) {
    console.error("\n❌ Ошибка:", error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Ошибка выполнения:", err.message ?? err);
  process.exit(1);
});
