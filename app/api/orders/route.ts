import { type NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  notifyAdminNewOrder,
  notifyClientOrderReceived,
  type OrderNotificationData,
} from "@/lib/telegram";

// ─── Типы входящего запроса ──────────────────────────────────────────────────

interface OrderItemInput {
  productId: number;
  quantity: number;
}

interface CreateOrderBody {
  customerName: string;
  customerPhone: string;
  /** Telegram chat_id клиента — если передан, клиент получит подтверждение */
  telegramChatId?: string | number;
  fulfillmentType?: "dine_in" | "pickup" | "delivery";
  deliveryAddress?: string;
  comment?: string;
  items: OrderItemInput[];
}

// ─── POST /api/orders ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: CreateOrderBody;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  // Валидация обязательных полей
  const { customerName, customerPhone, items, fulfillmentType = "pickup" } = body;

  if (!customerName?.trim()) {
    return Response.json({ error: "Поле customerName обязательно" }, { status: 400 });
  }
  if (!customerPhone?.trim()) {
    return Response.json({ error: "Поле customerPhone обязательно" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Заказ должен содержать хотя бы один товар" }, { status: 400 });
  }

  // Загружаем продукты из БД для расчёта суммы
  const productIds = items.map((i) => i.productId);
  const dbProducts = await db
    .select()
    .from(products)
    .where(eq(products.id, productIds[0])); // fallback для одного id

  // Для нескольких продуктов используем inArray если доступен, иначе фетчим поочерёдно
  const productMap = new Map<number, { name: string; price: string }>();

  for (const item of items) {
    const [product] = await db
      .select({ id: products.id, name: products.name, price: products.price })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product) {
      return Response.json(
        { error: `Продукт с id ${item.productId} не найден` },
        { status: 404 }
      );
    }
    productMap.set(item.productId, { name: product.name, price: product.price });
  }

  // Рассчитываем итоговую сумму
  const totalAmount = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + parseFloat(product.price) * item.quantity;
  }, 0);

  // Генерируем номер заказа
  const orderNumber = `SC-${Date.now()}`;

  // Создаём заказ в БД
  const [newOrder] = await db
    .insert(orders)
    .values({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      totalAmount: totalAmount.toFixed(2),
      status: "pending",
    })
    .returning();

  // Создаём позиции заказа
  const itemsToInsert = items.map((item) => ({
    orderId: newOrder.id,
    productId: item.productId,
    quantity: item.quantity,
    price: (parseFloat(productMap.get(item.productId)!.price) * item.quantity).toFixed(2),
  }));

  await db.insert(orderItems).values(itemsToInsert);

  // ─── Telegram-уведомления ────────────────────────────────────────────────

  const notificationData: OrderNotificationData = {
    orderNumber,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    fulfillmentType,
    deliveryAddress: body.deliveryAddress,
    comment: body.comment,
    totalAmount: totalAmount.toFixed(2),
    items: items.map((item) => ({
      title: productMap.get(item.productId)!.name,
      quantity: item.quantity,
      unitPrice: productMap.get(item.productId)!.price,
    })),
  };

  // Уведомление администратору (не блокируем ответ при ошибке)
  notifyAdminNewOrder(notificationData).catch((err) =>
    console.error("[Telegram] Ошибка уведомления администратора:", err)
  );

  // Подтверждение клиенту (если передан telegramChatId)
  if (body.telegramChatId) {
    notifyClientOrderReceived({
      telegramChatId: body.telegramChatId,
      orderNumber,
      customerName: customerName.trim(),
      totalAmount: totalAmount.toFixed(2),
      fulfillmentType,
      estimatedMinutes: fulfillmentType === "delivery" ? 45 : 20,
    }).catch((err) =>
      console.error("[Telegram] Ошибка уведомления клиента:", err)
    );
  }

  return Response.json(
    {
      success: true,
      order: {
        id: newOrder.id,
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        status: newOrder.status,
        createdAt: newOrder.createdAt,
      },
    },
    { status: 201 }
  );
}

// ─── GET /api/orders ─────────────────────────────────────────────────────────

export async function GET() {
  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(orders.createdAt);

  return Response.json({ orders: allOrders });
}
