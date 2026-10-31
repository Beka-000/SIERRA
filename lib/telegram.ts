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

interface TelegramOrderPayload {
  orderId:          string;
  orderNumber:      string;
  customerName:     string;
  customerPhone:    string;
  fulfillmentType:  "dine_in" | "pickup" | "delivery";
  deliveryAddress:  string | null;
  pickupBranchId?:  string | null;
  pickupBranchName?: string | null;
  comment:          string | null;
  totalAmount:      number;
  discountAmount:   number;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
}

export async function sendTelegramOrder(order: TelegramOrderPayload) {
  const isPickup   = order.fulfillmentType === "pickup";
  const isDelivery = order.fulfillmentType === "delivery";

  // Строка способа получения
  let fulfillmentLine: string;
  if (isPickup) {
    fulfillmentLine = order.pickupBranchName
      ? `🏠 Самовывоз: <b>${order.pickupBranchName}</b>`
      : "🏠 Самовывоз";
    if (order.deliveryAddress) {
      fulfillmentLine += `\n📍 ${order.deliveryAddress}`;
    }
  } else if (isDelivery) {
    fulfillmentLine = `🚗 Доставка: ${order.deliveryAddress || "адрес не указан"}`;
  } else {
    fulfillmentLine = "🪑 В заведении";
  }

  // Состав заказа
  const itemLines = order.items
    .map((i) => `  • ${i.title} × ${i.quantity} = ${(i.unitPrice * i.quantity).toLocaleString("ru")} с`)
    .join("\n");

  const discountLine =
    order.discountAmount > 0
      ? `\nСкидка: -${order.discountAmount.toLocaleString("ru")} с`
      : "";

  const commentLine = order.comment ? `\n💬 ${order.comment}` : "";

  const text =
    `🧾 <b>Новый заказ #${order.orderNumber}</b>\n` +
    `\n👤 ${order.customerName}\n` +
    `📞 ${order.customerPhone}\n` +
    `${fulfillmentLine}\n` +
    `${commentLine}` +
    `\n─────────────────\n` +
    `${itemLines}\n` +
    `─────────────────\n` +
    `${discountLine ? discountLine + "\n" : ""}` +
    `💰 Итого: <b>${order.totalAmount.toLocaleString("ru")} с</b>`;

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
