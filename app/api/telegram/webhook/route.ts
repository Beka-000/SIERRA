import { type NextRequest } from "next/server";
import { sendMessage } from "@/lib/telegram";

/**
 * Telegram Webhook — принимает входящие сообщения от бота.
 *
 * Как зарегистрировать вебхук:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook
 *
 * Локальная разработка — используй ngrok или аналог:
 *   ngrok http 3000
 *   затем зарегистрируй полученный https URL как вебхук.
 */

// ─── Типы Telegram Update ────────────────────────────────────────────────────

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// ─── Команды бота ────────────────────────────────────────────────────────────

async function handleCommand(chatId: number, text: string, from?: TelegramUser): Promise<void> {
  const name = from?.first_name ?? "Гость";
  const command = text.split(" ")[0].toLowerCase();

  switch (command) {
    case "/start":
      await sendMessage(
        chatId,
        `Привет, <b>${name}</b>! ☕️\n\nДобро пожаловать в <b>Sierra Coffee</b>.\n\nЗдесь вы будете получать уведомления о статусе ваших заказов.\n\nВаш Telegram ID: <code>${chatId}</code>\n\nСкопируйте его и укажите при оформлении заказа — и мы будем держать вас в курсе!`
      );
      break;

    case "/myid":
      await sendMessage(
        chatId,
        `Ваш Telegram Chat ID: <code>${chatId}</code>`
      );
      break;

    case "/help":
      await sendMessage(
        chatId,
        [
          "📋 <b>Доступные команды:</b>",
          "",
          "/start — Приветствие и инструкция",
          "/myid — Показать ваш Telegram ID",
          "/help — Список команд",
        ].join("\n")
      );
      break;

    default:
      // Неизвестное сообщение — отвечаем подсказкой
      await sendMessage(
        chatId,
        `Используйте /help чтобы увидеть список команд.\n\nВаш ID: <code>${chatId}</code>`
      );
  }
}

// ─── POST /api/telegram/webhook ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let update: TelegramUpdate;

  try {
    update = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const message = update.message;

  if (message?.text) {
    await handleCommand(message.chat.id, message.text, message.from).catch((err) =>
      console.error("[Telegram Webhook] Ошибка обработки сообщения:", err)
    );
  }

  // Telegram требует ответ 200 OK как можно быстрее
  return new Response("OK", { status: 200 });
}
