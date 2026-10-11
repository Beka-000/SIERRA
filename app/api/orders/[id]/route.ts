import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint-utils";

/**
 * GET /api/orders/[id]
 * Получение информации о конкретном заказе
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentSession();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                photoFile: true,
                category: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Проверка доступа: заказ может видеть только его владелец или администратор
    if (session) {
      const userRole = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { role: true },
      });

      const isAdmin = userRole?.role?.code === "admin" || userRole?.role?.code === "manager";
      const isOwner = order.userId === session.userId;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    } else {
      // Для неавторизованных пользователей разрешаем просмотр только по номеру телефона
      // Это можно использовать для отслеживания заказа по номеру
      const phone = request.nextUrl.searchParams.get("phone");
      if (!phone || order.customerPhone !== phone) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Сериализуем BigInt поля
    const serializedOrder = {
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
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("[Order GET Error]", error);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 * Обновление статуса заказа (только для администраторов)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Проверяем права администратора
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { role: true },
    });

    const isAdmin = user?.role?.code === "admin" || user?.role?.code === "manager";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Проверяем существование заказа
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Обновляем статус
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    // Сериализуем BigInt поля
    const serializedOrder = {
      ...updatedOrder,
      subtotal: serializeBigInt(updatedOrder.subtotal),
      discountAmount: serializeBigInt(updatedOrder.discountAmount),
      totalAmount: serializeBigInt(updatedOrder.totalAmount),
      items: updatedOrder.items.map((item) => ({
        ...item,
        unitPrice: serializeBigInt(item.unitPrice),
        lineTotal: serializeBigInt(item.lineTotal),
        product: {
          ...item.product,
          price: serializeBigInt(item.product.price),
          oldPrice: item.product.oldPrice ? serializeBigInt(item.product.oldPrice) : null,
        },
      })),
      payments: updatedOrder.payments.map((payment) => ({
        ...payment,
        amount: serializeBigInt(payment.amount),
      })),
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("[Order PATCH Error]", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
