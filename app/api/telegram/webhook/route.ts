import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { editOrderMessage } from "@/lib/telegram";

/**
 * POST /api/telegram/webhook
 *
 * Принимает обновления от Telegram Bot API (callback_query от инлайн кнопок).
 * Callback data формат: "order:<orderId>:<newStatus>"
 *
 * Безопасность: проверяем секрет через заголовок X-Telegram-Bot-Api-Secret-Token
 * (необязателен на dev, но рекомендуется настроить через setWebhook с параметром secret_token).
 */

// Маппинг статусов: telegram action → OrderStatus в БД
const ALLOWED_TRANSITIONS: Record<string, string> = {
  CONFIRMED:        "CONFIRMED",
  COOKING:          "COOKING",
  READY:            "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  COMPLETED:        "COMPLETED",
  CANCELLED:        "CANCELLED",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED:        "✅ Принят",
  COOKING:          "👨‍🍳 Готовится",
  READY:            "🔔 Готов",
  OUT_FOR_DELIVERY: "🚗 Передан курьеру",
  COMPLETED:        "🎉 Выполнен",
  CANCELLED:        "❌ Отменён",
};

export async function POST(request: NextRequest) {
  try {
    // Опциональная проверка секрета (если настроен при регистрации webhook)
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
      const incoming = request.headers.get("x-telegram-bot-api-secret-token");
      if (incoming !== secret) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();

    // Обрабатываем только callback_query (нажатия инлайн кнопок)
    const callbackQuery = body?.callback_query;
    if (!callbackQuery) {
      // Другие типы обновлений (сообщения и пр.) — просто игнорируем
      return NextResponse.json({ ok: true });
    }

    const { id: callbackQueryId, data: callbackData, from, message } = callbackQuery;

    // Отвечаем Telegram сразу, чтобы убрать "loading" на кнопке
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });

    // Парсим callback data: "order:<orderId>:<newStatus>"
    if (!callbackData || !callbackData.startsWith("order:")) {
      return NextResponse.json({ ok: true });
    }

    const parts = callbackData.split(":");
    if (parts.length !== 3) {
      return NextResponse.json({ ok: true });
    }

    const [, orderId, rawStatus] = parts;
    const newStatus = ALLOWED_TRANSITIONS[rawStatus];

    if (!newStatus) {
      console.warn(`[TG Webhook] Неизвестный статус: ${rawStatus}`);
      return NextResponse.json({ ok: true });
    }

    // Ищем заказ в БД
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!order) {
      console.warn(`[TG Webhook] Заказ не найден: ${orderId}`);
      // Уведомляем нажавшего
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: "⚠️ Заказ не найден",
          show_alert: true,
        }),
      });
      return NextResponse.json({ ok: true });
    }

    // Не применяем одинаковый статус повторно
    if (order.status === newStatus) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: `Статус уже: ${STATUS_LABEL[newStatus] ?? newStatus}`,
          show_alert: false,
        }),
      });
      return NextResponse.json({ ok: true });
    }

    // Обновляем статус в БД
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as any },
    });

    console.log(
      `[TG Webhook] Заказ #${order.orderNumber}: ${order.status} → ${newStatus} (admin: ${from?.username ?? from?.id})`
    );

    // Редактируем сообщение в чате, обновляя текст и кнопки
    if (message?.chat?.id && message?.message_id && message?.text) {
      await editOrderMessage(
        message.chat.id,
        message.message_id,
        message.text,
        newStatus,
        from?.first_name ? `${from.first_name}${from.last_name ? " " + from.last_name : ""}` : from?.username
      );
    }

    // Всплывающее уведомление для нажавшего
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: `${STATUS_LABEL[newStatus] ?? newStatus} — Заказ #${order.orderNumber}`,
        show_alert: false,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Не логируем токен — только сообщение ошибки
    console.error("[TG Webhook] Error:", error instanceof Error ? error.message : String(error));
    // Возвращаем 200 чтобы Telegram не повторял запрос
    return NextResponse.json({ ok: true });
  }
}

// Telegram шлёт GET при проверке webhook — отвечаем 200
export async function GET() {
  return NextResponse.json({ ok: true, service: "Sierra Coffee Telegram Webhook" });
}
