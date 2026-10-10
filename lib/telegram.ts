/**
 * Утилита для отправки Telegram-сообщений через Bot API.
 * Использует нативный fetch, без импорта node-telegram-bot-api на сервере,
 * чтобы избежать проблем совместимости с Edge/Node runtime.
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

// ─── Уведомление администратору о новом заказе ───────────────────────────────

export interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: "dine_in" | "pickup" | "delivery";
  deliveryAddress?: string;
  comment?: string;
  totalAmount: string | number;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: string | number;
  }>;
}

export async function notifyAdminNewOrder(order: OrderNotificationData): Promise<void> {
  if (!ADMIN_CHAT_ID) {
    console.warn("[Telegram] TELEGRAM_ADMIN_CHAT_ID не задан — уведомление пропущено");
    return;
  }

  const fulfillmentLabel: Record<OrderNotificationData["fulfillmentType"], string> = {
    dine_in: "🪑 В зале",
    pickup: "🛍 Самовывоз",
    delivery: "🚗 Доставка",
  };

  const itemsList = order.items
    .map((i) => `  • ${i.title} × ${i.quantity} — ${Number(i.unitPrice).toFixed(2)} ₸`)
    .join("\n");

  const text = [
    `☕️ <b>Новый заказ #${order.orderNumber}</b>`,
    ``,
    `👤 <b>Клиент:</b> ${order.customerName}`,
    `📱 <b>Телефон:</b> ${order.customerPhone}`,
    `📦 <b>Тип:</b> ${fulfillmentLabel[order.fulfillmentType]}`,
    order.deliveryAddress ? `📍 <b>Адрес:</b> ${order.deliveryAddress}` : null,
    order.comment ? `💬 <b>Комментарий:</b> ${order.comment}` : null,
    ``,
    `🛒 <b>Состав заказа:</b>`,
    itemsList,
    ``,
    `💰 <b>Итого:</b> ${Number(order.totalAmount).toFixed(2)} ₸`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  await sendMessage(ADMIN_CHAT_ID, text);
}

// ─── Подтверждение клиенту ───────────────────────────────────────────────────

export interface ClientConfirmationData {
  telegramChatId: string | number;
  orderNumber: string;
  customerName: string;
  totalAmount: string | number;
  fulfillmentType: "dine_in" | "pickup" | "delivery";
  estimatedMinutes?: number;
}

export async function notifyClientOrderReceived(data: ClientConfirmationData): Promise<void> {
  const fulfillmentHint: Record<ClientConfirmationData["fulfillmentType"], string> = {
    dine_in: "Ваш заказ готовится — скоро принесём к столику.",
    pickup: "Как только заказ будет готов, вы получите уведомление.",
    delivery: "Наш курьер доставит заказ в ближайшее время.",
  };

  const eta = data.estimatedMinutes
    ? `\n⏱ Ожидаемое время: <b>~${data.estimatedMinutes} мин</b>`
    : "";

  const text = [
    `✅ <b>Заказ принят, ${data.customerName}!</b>`,
    ``,
    `Номер вашего заказа: <b>#${data.orderNumber}</b>`,
    `Сумма: <b>${Number(data.totalAmount).toFixed(2)} ₸</b>${eta}`,
    ``,
    fulfillmentHint[data.fulfillmentType],
    ``,
    `Спасибо, что выбрали <b>Sierra Coffee</b> ☕️`,
  ].join("\n");

  await sendMessage(data.telegramChatId, text);
}

// ─── Уведомление клиенту об изменении статуса ────────────────────────────────

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED: "✅ Ваш заказ <b>подтверждён</b> и передан на кухню.",
  COOKING: "👨‍🍳 Ваш заказ <b>готовится</b>.",
  READY: "🔔 Ваш заказ <b>готов!</b>",
  OUT_FOR_DELIVERY: "🚗 Ваш заказ <b>передан курьеру</b>.",
  COMPLETED: "🎉 Заказ <b>выполнен</b>. Приятного аппетита!",
  CANCELLED: "❌ Ваш заказ <b>отменён</b>. Свяжитесь с нами, если это ошибка.",
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
