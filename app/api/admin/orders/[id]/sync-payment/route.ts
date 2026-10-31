/**
 * POST /api/admin/orders/[id]/sync-payment
 *
 * Ручная синхронизация статуса заказа с фактическим статусом платежа в БД.
 *
 * Когда это нужно:
 *   — Webhook от Finik пришёл, Payment.status = "success",
 *     но Order.status застрял в "NEW" (например из-за ошибки транзакции).
 *   — DNS/страница возврата была временно недоступна, пользователь не вернулся,
 *     но платёж прошёл и webhook обработался.
 *
 * Что делает:
 *   1. Читает последний Payment заказа.
 *   2. Если payment.status = "success" и order.status = "NEW" → ставит CONFIRMED.
 *   3. Если payment.status = "failed"/"cancelled" и order не завершён → ставит CANCELLED.
 *   4. В остальных случаях ничего не меняет, возвращает текущий статус.
 *
 * Что НЕ делает:
 *   — Не делает запросов к Finik API (у Finik нет публичного GET-статуса платежа).
 *   — Не меняет статус на основе внешних параметров запроса.
 *   — Не создаёт новые платежи.
 *
 * Требует роли: admin или manager.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Авторизация ───────────────────────────────────────────────────────────
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: { select: { code: true } } },
    });

    const adminRoles = ["admin", "manager"];
    if (!adminRoles.includes(user?.role?.code ?? "")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ── Читаем заказ ──────────────────────────────────────────────────────────
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = order.payments[0] ?? null;

    if (!payment) {
      return NextResponse.json({
        synced:  false,
        reason:  "no_payment_record",
        message: "Для этого заказа нет записи о платеже.",
        orderStatus:   order.status,
        paymentStatus: null,
      });
    }

    const payStatus   = payment.status;
    const orderStatus = order.status;

    // ── Уже в терминальном состоянии — ничего не делаем ─────────────────────
    const terminalOrder   = ["COMPLETED", "CANCELLED"].includes(orderStatus);
    const terminalPayment = ["success", "failed", "cancelled"].includes(payStatus);

    if (terminalOrder && terminalPayment) {
      return NextResponse.json({
        synced:        false,
        reason:        "already_terminal",
        message:       "Заказ и платёж уже в финальном состоянии.",
        orderStatus,
        paymentStatus: payStatus,
      });
    }

    // ── Рассинхрон: платёж успешен, заказ не подтверждён ────────────────────
    if (payStatus === "success" && !["CONFIRMED", "COOKING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"].includes(orderStatus)) {
      await prisma.order.update({
        where: { id },
        data:  { status: "CONFIRMED" },
      });

      console.log(`[sync-payment] Order ${id} set to CONFIRMED by admin ${session.userId} (payment was already success)`);

      return NextResponse.json({
        synced:        true,
        action:        "order_confirmed",
        message:       "Заказ подтверждён — платёж уже был успешен, но статус заказа не обновился.",
        orderStatus:   "CONFIRMED",
        paymentStatus: payStatus,
      });
    }

    // ── Рассинхрон: платёж провален, заказ ещё активен ──────────────────────
    if (
      (payStatus === "failed" || payStatus === "cancelled") &&
      !["CANCELLED", "COMPLETED"].includes(orderStatus)
    ) {
      await prisma.order.update({
        where: { id },
        data:  { status: "CANCELLED" },
      });

      console.log(`[sync-payment] Order ${id} set to CANCELLED by admin ${session.userId} (payment was ${payStatus})`);

      return NextResponse.json({
        synced:        true,
        action:        "order_cancelled",
        message:       `Заказ отменён — платёж имел статус «${payStatus}».`,
        orderStatus:   "CANCELLED",
        paymentStatus: payStatus,
      });
    }

    // ── Всё согласовано, изменений не нужно ──────────────────────────────────
    return NextResponse.json({
      synced:        false,
      reason:        "already_consistent",
      message:       "Статусы заказа и платежа согласованы. Изменений не требуется.",
      orderStatus,
      paymentStatus: payStatus,
    });

  } catch (error) {
    console.error("[sync-payment POST]", error);
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Внутренняя ошибка" },
      { status: 500 }
    );
  }
}
