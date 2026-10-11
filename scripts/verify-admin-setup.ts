/**
 * Полная проверка настройки администратора
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
  console.log("🔍 Проверка настроек администратора...\n");

  try {
    // 1. Проверка пользователя
    console.log("1️⃣ Проверка пользователя:");
    const userResult = await client.query(
      `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.is_blocked,
        r.code as role_code,
        r.title as role_title,
        r.permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
      `,
      ["kojomkulov2004@gmail.com"]
    );

    if (userResult.rows.length === 0) {
      console.log("   ❌ Пользователь не найден");
      return;
    }

    const user = userResult.rows[0];
    console.log(`   ✓ Email: ${user.email}`);
    console.log(`   ✓ Имя: ${user.name}`);
    console.log(`   ✓ Роль: ${user.role_title} (${user.role_code})`);
    console.log(`   ✓ Заблокирован: ${user.is_blocked ? "Да ❌" : "Нет ✓"}`);
    console.log(`   ✓ Права: ${JSON.stringify(user.permissions)}`);

    if (user.role_code !== "admin") {
      console.log("   ❌ Роль НЕ admin!");
      return;
    }

    // 2. Проверка настроек Telegram
    console.log("\n2️⃣ Проверка Telegram настроек:");
    const settingsResult = await client.query(
      `
      SELECT key, value 
      FROM settings 
      WHERE key IN ('ADMIN_TELEGRAM_BOT_TOKEN', 'ADMIN_TELEGRAM_USER_ID')
      ORDER BY key
      `
    );

    const settings: Record<string, string> = {};
    settingsResult.rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    const botToken = settings["ADMIN_TELEGRAM_BOT_TOKEN"];
    const chatId = settings["ADMIN_TELEGRAM_USER_ID"];

    if (botToken && botToken.length > 20) {
      console.log("   ✓ ADMIN_TELEGRAM_BOT_TOKEN настроен");
    } else {
      console.log("   ❌ ADMIN_TELEGRAM_BOT_TOKEN не настроен");
    }

    if (chatId && chatId.length > 5) {
      console.log(`   ✓ ADMIN_TELEGRAM_USER_ID: ${chatId}`);
    } else {
      console.log("   ❌ ADMIN_TELEGRAM_USER_ID не настроен");
    }

    // 3. Итоговый статус
    console.log("\n" + "═".repeat(50));
    if (user.role_code === "admin" && !user.is_blocked && botToken && chatId) {
      console.log("✅ ВСЁ ГОТОВО! Администратор настроен правильно.");
      console.log("\n📋 Данные для входа в админку:");
      console.log("   URL:    http://localhost:3000/admin/login");
      console.log("   Email:  kojomkulov2004@gmail.com");
      console.log("   Пароль: admin1234!");
      console.log("\n💡 После ввода email и пароля код придёт в Telegram.");
    } else {
      console.log("⚠️  Есть проблемы с настройкой:");
      if (user.role_code !== "admin") console.log("   - Роль не admin");
      if (user.is_blocked) console.log("   - Аккаунт заблокирован");
      if (!botToken) console.log("   - Telegram бот не настроен");
      if (!chatId) console.log("   - Telegram chat ID не настроен");
    }
    console.log("═".repeat(50) + "\n");

  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Ошибка:", err.message ?? err);
  process.exit(1);
});
