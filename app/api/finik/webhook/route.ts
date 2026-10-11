import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFinikWebhook, isTimestampValid, type FinikWebhookData } from "@/lib/finik";

/**
 * POST /api/finik/webhook
 * Обработка webhook уведомлений от Finik Pay
 * 
 * Важно: этот endpoint должен быть доступен публично (без авторизации)
 * для получения уведомлений от внешнего сервиса
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Получаем данные из запроса
    const body = await request.json();
    const signature = request.headers.get("signature") || "";
    const timestamp = request.headers.get("x-api-timestamp") || "";

    console.log("[Finik Webhook] Received:", {
      timestamp,
      hasSignature: !!signature,
      bodyKeys: Object.keys(body),
    });

    // 2. Проверяем timestamp (защита от replay атак)
    if (!isTimestampValid(timestamp)) {
      console.error("[Finik Webhook] Invalid timestamp:", timestamp);
      return NextResponse.json(
        { error: "Invalid timestamp" },
        { status: 400 }
      );
    }

    // 3. Верифицируем подпись
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const isValid = await verifyFinikWebhook(
      signature,
      timestamp,
      body,
      headers,
      "/api/finik/webhook"
    );

    if (!isValid) {
      console.error("[Finik Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // 4. Парсим данные webhook
    const webhookData: FinikWebhookData = body;

    // Извлекаем metadata с информацией о заказе
    let metadata: { orderId?: string; userId?: string; paymentId?: string } = {};
    
    if (webhookData.data?.metadata) {
      try {
        metadata = typeof webhookData.data.metadata === "string"
          ? JSON.parse(webhookData.data.metadata)
          : webhookData.data.metadata;
      } catch (e) {
        console.error("[Finik Webhook] Failed to parse metadata:", e);
      }
    }

    const orderId = metadata.orderId;
    if (!orderId) {
      console.error("[Finik Webhook] Order ID not found in metadata");
      return NextResponse.json(
        { error: "Order ID not found" },
        { status: 400 }
      );
    }

    console.log("[Finik Webhook] Processing payment for order:", orderId);

    // 5. Определяем статус платежа
    const paymentStatus = webhookData.status.toLowerCase();
    const isSuccessful = paymentStatus === "succeeded" || paymentStatus === "success";
    const isFailed = paymentStatus === "failed" || paymentStatus === "error";

    // 6. Обновляем данные в БД через транзакцию
    await prisma.$transaction(async (tx) => {
      // Проверяем существование заказа
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      const payment = order.payments[0];
      if (!payment) {
        throw new Error(`Payment record not found for order ${orderId}`);
      }

      // Проверяем, не обработан ли уже этот webhook (идемпотентность)
      if (payment.status === "success" && isSuccessful) {
        console.log("[Finik Webhook] Payment already processed, skipping");
        return;
      }

      // Обновляем статус платежа
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccessful ? "success" : isFailed ? "failed" : "pending",
          providerPaymentId: webhookData.id || payment.providerPaymentId,
          webhookPayload: webhookData as any,
          updatedAt: new Date(),
        },
      });

      // Обновляем статус заказа
      if (isSuccessful) {
        // Успешная оплата - подтверждаем заказ
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CONFIRMED",
            updatedAt: new Date(),
          },
        });

        console.log("[Finik Webhook] Order confirmed:", orderId);

        // TODO: Здесь можно добавить отправку уведомлений
        // - Email/SMS клиенту
        // - Уведомление на кухню
        // - Telegram уведомление админам
      } else if (isFailed) {
        // Неудачная оплата - отменяем заказ
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            updatedAt: new Date(),
          },
        });

        console.log("[Finik Webhook] Order cancelled due to payment failure:", orderId);
      }
    });

    // 7. Логируем успешную обработку
    console.log("[Finik Webhook] Successfully processed:", {
      orderId,
      status: paymentStatus,
      transactionId: webhookData.transactionId,
    });

    // 8. Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      orderId,
      status: paymentStatus,
    });
  } catch (error) {
    console.error("[Finik Webhook Error]", error);
    
    // Важно: возвращаем 200 даже при ошибках обработки,
    // чтобы Finik не повторял запрос бесконечно
    // Но логируем ошибку для расследования
    return NextResponse.json(
      {
        error: "Internal error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/finik/webhook
 * Endpoint для проверки доступности webhook
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "finik-webhook",
    timestamp: new Date().toISOString(),
  });
}
