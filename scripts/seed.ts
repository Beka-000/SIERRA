/**
 * Скрипт инициализации БД — Sierra Coffee
 *
 * Запуск: npx tsx scripts/seed.ts
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
  console.log("🌱 Инициализация базы данных Sierra Coffee...\n");

  try {
    // ─── 1. Создаём роли ──────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO roles (id, code, title, permissions)
      VALUES
        (gen_random_uuid(), 'admin',   'Администратор', '{"all": true}'::jsonb),
        (gen_random_uuid(), 'manager', 'Менеджер',      '{"orders": true, "menu": true}'::jsonb),
        (gen_random_uuid(), 'staff',   'Сотрудник',     '{"orders": true}'::jsonb),
        (gen_random_uuid(), 'client',  'Клиент',        '{}'::jsonb),
        (gen_random_uuid(), 'guest',   'Гость',         '{}'::jsonb)
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log("✓ Роли созданы");

    // Получаем id роли admin
    const roleRes = await client.query(
      `SELECT id FROM roles WHERE code = 'admin' LIMIT 1`
    );
    const adminRoleId = roleRes.rows[0]?.id;
    if (!adminRoleId) throw new Error("Роль admin не найдена");

    // ─── 2. Создаём admin-пользователя ────────────────────────────────────────
    const adminPassword = "Admin@Sierra2024";
    const passwordHash = await hash(adminPassword, 12);

    await client.query(
      `
      INSERT INTO users (id, role_id, name, phone, email, password_hash, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
      ON CONFLICT (email) DO UPDATE
        SET role_id       = EXCLUDED.role_id,
            name          = EXCLUDED.name,
            password_hash = EXCLUDED.password_hash,
            updated_at    = NOW();
      `,
      [
        adminRoleId,
        "Администратор",
        "+996000000000",
        "admin@sierracoffee.kz",
        passwordHash,
      ]
    );
    console.log("✓ Admin-пользователь создан");
    console.log("  Email:   admin@sierracoffee.kz");
    console.log(`  Пароль:  ${adminPassword}`);

    // ─── 3. Настройки Telegram ─────────────────────────────────────────────────
    const botToken    = process.env.TELEGRAM_BOT_TOKEN    ?? "";
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";

    await client.query(
      `
      INSERT INTO settings (key, value, description)
      VALUES
        ($1, $2, 'Токен Telegram-бота для 2FA'),
        ($3, $4, 'Telegram Chat ID администратора для 2FA')
      ON CONFLICT (key) DO UPDATE
        SET value      = EXCLUDED.value,
            updated_at = NOW();
      `,
      [
        "ADMIN_TELEGRAM_BOT_TOKEN", botToken,
        "ADMIN_TELEGRAM_USER_ID",   adminChatId,
      ]
    );
    console.log("✓ Настройки Telegram записаны в settings");

    if (!adminChatId) {
      console.log("\n⚠️  TELEGRAM_ADMIN_CHAT_ID пустой!");
      console.log("   1. Напишите /myid своему боту в Telegram");
      console.log("   2. Скопируйте числовой ID");
      console.log("   3. Вставьте в .env → TELEGRAM_ADMIN_CHAT_ID=<id>");
      console.log("   4. Запустите: npx tsx scripts/seed.ts\n");
    } else {
      console.log(`  Chat ID: ${adminChatId}`);
    }

    console.log("\n✅ Готово! Откройте /admin/login для входа.\n");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Ошибка:", err.message ?? err);
  process.exit(1);
});
