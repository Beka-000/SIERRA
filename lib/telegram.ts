/**
 * Утилита для отправки Telegram-сообщений через Bot API.
 * Использует нативный fetch, без сторонних библиотек.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID!;

const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Базовая отправка ────────────────────────────────────────────────────────

export async function sendMessage(chatId: string | number, text: string): Promise<void> {
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Telegram] sendMessage failed: ${err}`);
  }
}

// ─── Уведомление о новом заказе ─────────────────────────────────────────────

export async function sendTelegramOrder(order: any) {
  const text = `🧾 <b>Новый заказ #${order.id.slice(0, 8)}</b>\n\nКлиент: ${order.customerName || "Гость"}\nТелефон: ${order.customerPhone || "-"}\nСумма: ${order.total} сом\nАдрес: ${order.address || "Самовывоз"}`;

  await sendMessage(ADMIN_CHAT_ID, text);
}

// ─── Уведомление клиенту об изменении статуса ────────────────────────────────

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED:        "✅ Ваш заказ <b>подтверждён</b> и передан на кухню.",
  COOKING:          "👨‍🍳 Ваш заказ <b>готовится</b>.",
  READY:            "🔔 Ваш заказ <b>готов!</b>",
  OUT_FOR_DELIVERY: "🚗 Ваш заказ <b>передан курьеру</b>.",
  COMPLETED:        "🎉 Заказ <b>выполнен</b>. Приятного аппетита!",
  CANCELLED:        "❌ Ваш заказ <b>отменён</b>. Свяжитесь с нами, если это ошибка.",
};

export async function notifyClientStatusChange(
  telegramChatId: string | number,
  orderNumber: string,
  newStatus: string
): Promise<void> {
  const message = STATUS_MESSAGES[newStatus];
  if (!message) return;

  const text = `${message}\n\nЗаказ <b>#${orderNumber}</b>`;
  await sendMessage(telegramChatId, text);
}

// ─── Редактирование сообщения с обновлённым статусом ────────────────────────

const STATUS_EMOJI: Record<string, string> = {
  NEW:              "🆕",
  CONFIRMED:        "✅",
  COOKING:          "👨‍🍳",
  READY:            "🔔",
  OUT_FOR_DELIVERY: "🚗",
  COMPLETED:        "🎉",
  CANCELLED:        "❌",
};

const STATUS_LABEL: Record<string, string> = {
  NEW:              "Новый",
  CONFIRMED:        "Принят",
  COOKING:          "Готовится",
  READY:            "Готов",
  OUT_FOR_DELIVERY: "Передан курьеру",
  COMPLETED:        "Выполнен",
  CANCELLED:        "Отменён",
};

export async function editOrderMessage(
  chatId: string | number,
  messageId: number,
  originalText: string,
  newStatus: string,
  updatedBy?: string
): Promise<void> {
  const emoji = STATUS_EMOJI[newStatus] ?? "•";
  const label = STATUS_LABEL[newStatus] ?? newStatus;
  const byLine = updatedBy ? ` (${updatedBy})` : "";
  const newText = `${originalText}\n\n${emoji} <b>Статус изменён на: ${label}</b>${byLine}`;

  const res = await fetch(`${TG_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: "HTML",
      reply_markup: ["COMPLETED", "CANCELLED"].includes(newStatus)
        ? { inline_keyboard: [] }
        : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Telegram] editOrderMessage failed (status ${res.status}): ${err}`);
  }
}
