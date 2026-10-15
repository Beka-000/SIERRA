/**
 * scripts/set-webhook.ts
 * Регистрирует Telegram webhook.
 * Запуск: npx tsx scripts/set-webhook.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN не найден в .env");
  process.exit(1);
}

if (!APP_URL) {
  console.error("❌ NEXT_PUBLIC_APP_URL не найден в .env");
  process.exit(1);
}

const WEBHOOK_URL = `${APP_URL}/api/telegram/webhook`;

async function main() {
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🤖 Token: ${TOKEN!.slice(0, 10)}...`);

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      allowed_updates: ["callback_query", "message"],
      drop_pending_updates: true,
    }),
  });

  const data = await res.json();
  console.log("\n📬 Ответ Telegram:");
  console.log(JSON.stringify(data, null, 2));

  // Проверяем текущее состояние webhook
  const infoRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getWebhookInfo`);
  const info = await infoRes.json();
  console.log("\n📋 getWebhookInfo:");
  console.log(JSON.stringify(info.result, null, 2));
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
