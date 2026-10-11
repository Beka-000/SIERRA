/**
 * Создание таблицы settings и добавление Telegram настроек
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
  console.log("🔧 Настройка таблицы settings...\n");

  try {
    // Создаём таблицу settings если её нет
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✓ Таблица settings создана/проверена");

    // Добавляем настройки Telegram из .env
    const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";

    await client.query(
      `
      INSERT INTO settings (key, value, description)
      VALUES
        ($1, $2, 'Токен Telegram-бота для 2FA'),
        ($3, $4, 'Telegram Chat ID администратора для 2FA')
      ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value,
            updated_at = NOW();
      `,
      [
        "ADMIN_TELEGRAM_BOT_TOKEN", botToken,
        "ADMIN_TELEGRAM_USER_ID", chatId,
      ]
    );

    console.log("✓ Настройки Telegram добавлены");
    console.log(`  Bot Token: ${botToken ? "✓ настроен" : "❌ пустой"}`);
    console.log(`  Chat ID: ${chatId ? chatId : "❌ пустой"}`);

    console.log("\n✅ Готово!\n");

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Ошибка:", err.message ?? err);
  process.exit(1);
});
