/**
 * GET /api/orders/[id]/payment-status
 *
 * Лёгкий endpoint для polling'а со страницы payment-success.
 * Возвращает только статус заказа и платежа — без товаров, адресов и личных данных.
 *
 * Доступ:
 *   - авторизованный владелец заказа
 *   - admin/manager
 *   - любой, передавший ?phone= совпадающий с customerPhone (как в /api/orders/[id])
 *
 * Намеренно НЕ принимает никаких внешних статусов и не меняет данные в БД.
 * Статус меняет только webhook от Finik.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint-utils";

// Сколько раз максимум клиент может сделать polling до отображения ошибки
// (контролируется на фронтенде; здесь нет rate-limit)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentSession();

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        customerPhone: true,
        userId: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            provider: true,
            providerPaymentId: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "not_found", message: "Заказ не найден" },
        { status: 404 }
      );
    }

    // ── Проверка доступа ─────────────────────────────────────────────────────
    if (session) {
      const userRole = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: { select: { code: true } } },
      });
      const isAdmin  = ["admin", "manager"].includes(userRole?.role?.code ?? "");
      const isOwner  = order.userId === session.userId;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "forbidden", message: "Доступ запрещён" },
          { status: 403 }
        );
      }
    } else {
      // Для неавторизованных — проверяем совпадение телефона
      const phone = request.nextUrl.searchParams.get("phone");
      if (!phone || order.customerPhone !== phone) {
        return NextResponse.json(
          { error: "forbidden", message: "Доступ запрещён" },
          { status: 403 }
        );
      }
    }

    const payment = order.payments[0] ?? null;

    return NextResponse.json({
      orderId:     order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      totalAmount: serializeBigInt(order.totalAmount),
      createdAt:   order.createdAt.toISOString(),
      payment: payment
        ? {
            id:                payment.id,
            status:            payment.status,
            amount:            serializeBigInt(payment.amount),
            provider:          payment.provider,
            providerPaymentId: payment.providerPaymentId,
            updatedAt:         payment.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[payment-status GET]", error);
    return NextResponse.json(
      { error: "server_error", message: "Внутренняя ошибка" },
      { status: 500 }
    );
  }
}
