/**
 * scripts/set-webhook-ngrok.ts
 *
 * 1. Открывает публичный туннель на порт 3000 через localtunnel (без регистрации)
 * 2. Регистрирует Telegram webhook
 * 3. Держит процесс живым — Ctrl+C для остановки
 *
 * Запуск: npx tsx scripts/set-webhook-ngrok.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import localtunnel from "localtunnel";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN не найден в .env");
  process.exit(1);
}

async function main() {
  console.log("🚀 Открываем туннель на порт 3000...");

  const tunnel = await localtunnel({ port: 3000 });

  const url = tunnel.url;
  const webhookUrl = `${url}/api/telegram/webhook`;

  console.log(`\n✅ Туннель активен!`);
  console.log(`   Публичный URL: ${url}`);
  console.log(`   Webhook URL:   ${webhookUrl}\n`);

  // Регистрируем webhook
  console.log("📡 Регистрируем webhook в Telegram...");

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["callback_query", "message"],
      drop_pending_updates: true,
    }),
  });

  const data = await res.json();
  console.log("📬 Ответ Telegram:", JSON.stringify(data, null, 2));

  if (data.ok) {
    console.log(`\n🎉 Готово! Открывай сайт: ${url}`);
    console.log("   Делай заказы — уведомления придут в Telegram бот");
    console.log("   Нажми Ctrl+C чтобы остановить туннель\n");
  } else {
    console.error("❌ Telegram не принял webhook:", data.description);
  }

  tunnel.on("error", (err: Error) => {
    console.error("[tunnel] ошибка:", err.message);
  });

  tunnel.on("close", () => {
    console.log("\n⏹  Туннель закрыт");
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("\n⏹  Останавливаем туннель...");
    tunnel.close();
  });

  // Держим процесс живым
  await new Promise(() => {});
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
