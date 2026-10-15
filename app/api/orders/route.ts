import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFinikPayment } from "@/lib/finik";
import { serializeBigInt } from "@/lib/bigint-utils";
import { sendTelegramOrder } from "@/lib/telegram";

/**
 * POST /api/orders
 * Создание нового заказа с интеграцией Finik Pay
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    const body = await request.json();
    
    console.log("[Orders API] Creating order:", {
      hasSession: !!session,
      userId: session?.userId,
      hasItems: !!body.items,
      itemsCount: body.items?.length || 0,
    });
    
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryType, // "delivery" | "pickup"
      deliveryAddress,
      comment,
      promocode, // Промокод для применения скидки
    } = body;

    // Валидация обязательных полей
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Customer name and phone are required" },
        { status: 400 }
      );
    }

    if (deliveryType === "delivery" && !deliveryAddress) {
      return NextResponse.json(
        { error: "Delivery address is required for delivery orders" },
        { status: 400 }
      );
    }

    // Генерируем уникальный idempotency key для предотвращения дублирования заказов
    const idempotencyKey = crypto.randomUUID();

    // Используем транзакцию для атомарного создания заказа
    const result = await prisma.$transaction(async (tx) => {
      // 1. Загружаем корзину пользователя
      let cartItems;
      
      // Приоритет: body.items → БД корзина (для авторизованных)
      // Это позволяет использовать localStorage корзину даже для авторизованных пользователей
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        // Получаем товары из тела запроса (для всех пользователей)
        const productIds = body.items.map((item: any) => item.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        if (products.length !== body.items.length) {
          throw new Error("Some products not found");
        }

        cartItems = body.items.map((item: any) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) throw new Error("Product not found");
          return {
            productId: item.productId,
            quantity: item.quantity,
            product,
            modifiers: item.modifiers || [],
          };
        });
      } else if (session) {
        // Fallback: для авторизованных пользователей пытаемся взять из БД
        const cart = await tx.cart.findUnique({
          where: { userId: session.userId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw new Error("Cart is empty. Please add items to cart.");
        }

        cartItems = cart.items;
      } else {
        // Ни body.items, ни session - ошибка
        throw new Error("Cart items are required for checkout");
      }

      // 2. Проверяем наличие всех товаров
      for (const item of cartItems) {
        if (!item.product.isAvailable) {
          throw new Error(`Product ${item.product.title} is not available`);
        }
      }

      // 3. Вычисляем итоговую сумму
      let subtotal = 0;
      const orderItems = cartItems.map((item: any) => {
        const unitPrice = Number(item.product.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          modifiers: item.modifiers || [],
        };
      });

      // 4. Проверяем и применяем промокод
      let discountAmount = 0;
      let appliedPromocode = null;

      if (promocode && typeof promocode === 'string') {
        // Ищем промокод
        const foundPromocode = await tx.promocode.findUnique({
          where: { code: promocode.toUpperCase() },
        });

        if (!foundPromocode) {
          throw new Error("Промокод не найден");
        }

        // Проверяем статус
        if (!foundPromocode.isActive) {
          throw new Error("Промокод неактивен");
        }

        const now = new Date();
        
        // Проверяем даты
        if (foundPromocode.validFrom && foundPromocode.validFrom > now) {
          throw new Error("Промокод еще не активен");
        }
        
        if (foundPromocode.validUntil && foundPromocode.validUntil < now) {
          throw new Error("Промокод истек");
        }

        // Проверяем лимит использования
        if (foundPromocode.usageLimit && foundPromocode.usedCount >= foundPromocode.usageLimit) {
          throw new Error("Промокод исчерпан");
        }

        // Проверяем минимальную сумму
        if (foundPromocode.minOrderAmount && subtotal < Number(foundPromocode.minOrderAmount)) {
          throw new Error(`Минимальная сумма заказа для промокода: ${foundPromocode.minOrderAmount} с`);
        }

        // Проверяем лимит на пользователя (только для авторизованных)
        if (session && foundPromocode.usesPerCustomer) {
          const userUsageCount = await tx.promocodeUsage.count({
            where: {
              promocodeId: foundPromocode.id,
              userId: session.userId,
            },
          });

          if (userUsageCount >= foundPromocode.usesPerCustomer) {
            throw new Error("Вы уже использовали этот промокод максимальное количество раз");
          }
        }

        // Проверяем для первого заказа
        if (session && foundPromocode.firstOrderOnly) {
          const existingOrders = await tx.order.count({
            where: { userId: session.userId },
          });

          if (existingOrders > 0) {
            throw new Error("Промокод действителен только для первого заказа");
          }
        }

        // Проверяем применимые товары
        if (foundPromocode.applicableProducts && foundPromocode.applicableProducts.length > 0) {
          const hasApplicableProduct = cartItems.some((item: any) =>
            foundPromocode.applicableProducts!.includes(item.productId)
          );

          if (!hasApplicableProduct) {
            throw new Error("Промокод не применим к товарам в корзине");
          }
        }

        // Проверяем применимые категории
        if (foundPromocode.applicableCategories && foundPromocode.applicableCategories.length > 0) {
          const hasApplicableCategory = cartItems.some((item: any) =>
            item.product.categoryId &&
            foundPromocode.applicableCategories!.includes(item.product.categoryId)
          );

          if (!hasApplicableCategory) {
            throw new Error("Промокод не применим к категориям товаров в корзине");
          }
        }

        // Вычисляем скидку
        if (foundPromocode.discountType === 'percent') {
          discountAmount = Math.floor(subtotal * Number(foundPromocode.discountValue) / 100);
          
          // Ограничиваем максимальную скидку
          if (foundPromocode.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, Number(foundPromocode.maxDiscountAmount));
          }
        } else {
          // fixed
          discountAmount = Math.min(Number(foundPromocode.discountValue), subtotal);
        }

        appliedPromocode = foundPromocode;
      }

      const totalAmount = subtotal - discountAmount;

      // 5. Генерируем уникальный номер заказа
      const orderNumber = `SC${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // 6. Создаем заказ
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.userId || null,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          fulfillmentType: deliveryType === "pickup" ? "pickup" : "delivery",
          deliveryAddress: deliveryType === "delivery" ? deliveryAddress : null,
          comment: comment || null,
          paymentMethod: "online",
          subtotal,
          discountAmount,
          totalAmount,
          status: "NEW",
          promocodeId: appliedPromocode?.id || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 7. Если применен промокод, обновляем счетчик и создаем запись использования
      if (appliedPromocode) {
        // Атомарно увеличиваем счетчик
        await tx.promocode.update({
          where: { id: appliedPromocode.id },
          data: { usedCount: { increment: 1 } },
        });

        // Создаем запись использования
        await tx.promocodeUsage.create({
          data: {
            promocodeId: appliedPromocode.id,
            orderId: order.id,
            userId: session?.userId || null,
            discountAmount,
          },
        });
      }

      // 8. Создаем запись о платеже
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "finik",
          status: "created",
          amount: totalAmount,
          idempotencyKey,
        },
      });

      // 9. Очищаем корзину пользователя (только для авторизованных)
      if (session) {
        await tx.cartItem.deleteMany({
          where: {
            cart: {
              userId: session.userId,
            },
          },
        });
      }

      return { order, payment };
    });

    // 10. Отправляем уведомление в Telegram (fire-and-forget, не блокируем ответ)
    sendTelegramOrder({
      orderId:         result.order.id,
      orderNumber:     result.order.orderNumber,
      customerName:    result.order.customerName,
      customerPhone:   result.order.customerPhone,
      fulfillmentType: result.order.fulfillmentType as "dine_in" | "pickup" | "delivery",
      deliveryAddress: result.order.deliveryAddress,
      comment:         result.order.comment,
      totalAmount:     Number(result.order.totalAmount),
      discountAmount:  Number(result.order.discountAmount),
      items: result.order.items.map((item) => ({
        title:     item.product.title,
        quantity:  item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    }).catch((err) => console.error("[Telegram] Notification failed:", err));

    // 11. Создаем платеж в Finik Pay
    try {
      const paymentUrl = await createFinikPayment({
        amount: Number(result.order.totalAmount),
        orderId: result.order.id,
        orderDescription: `Заказ #${result.order.orderNumber} в Sierra Coffee`,
        userId: session?.userId || "guest",
      });

      // Обновляем статус платежа
      await prisma.payment.update({
        where: { id: result.payment.id },
        data: {
          status: "pending",
          providerPaymentId: paymentUrl.split("payment/")[1]?.split("?")[0] || null,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        paymentUrl,
      });
    } catch (finikError) {
      console.error("Finik payment creation failed:", finikError);

      // Обновляем статус платежа на failed
      await prisma.payment.update({
        where: { id: result.payment.id },
        data: {
          status: "failed",
        },
      });

      // Возвращаем информацию о заказе, но без URL оплаты
      return NextResponse.json({
        success: true,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        paymentUrl: null,
        warning: "Payment creation failed. Please contact support.",
      });
    }
  } catch (error) {
    console.error("[Orders POST Error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * Получение списка заказов текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                photoFile: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.order.count({
      where: { userId: session.userId },
    });

    // Сериализуем BigInt поля
    const serializedOrders = orders.map((order) => ({
      ...order,
      subtotal: serializeBigInt(order.subtotal),
      discountAmount: serializeBigInt(order.discountAmount),
      totalAmount: serializeBigInt(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: serializeBigInt(item.unitPrice),
        lineTotal: serializeBigInt(item.lineTotal),
        product: {
          ...item.product,
          price: serializeBigInt(item.product.price),
          oldPrice: item.product.oldPrice ? serializeBigInt(item.product.oldPrice) : null,
        },
      })),
      payments: order.payments.map((payment) => ({
        ...payment,
        amount: serializeBigInt(payment.amount),
      })),
    }));

    return NextResponse.json({
      orders: serializedOrders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[Orders GET Error]", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
