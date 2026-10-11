import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint-utils";

/**
 * GET /api/admin/orders/[id]
 * Получение детальной информации о заказе (только для администраторов)
 */
export async function GET(
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

    const isAdmin = user?.role?.code === "admin" || user?.role?.code === "manager" || user?.role?.code === "kitchen";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                photoFile: {
                  select: {
                    url: true,
                  },
                },
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
            phone: true,
          },
        },
        promocode: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
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
        product: item.product ? {
          ...item.product,
          price: serializeBigInt(item.product.price),
        } : null,
      })),
      payments: order.payments.map((payment) => ({
        ...payment,
        amount: serializeBigInt(payment.amount),
      })),
      promocode: order.promocode ? {
        ...order.promocode,
        discountValue: serializeBigInt(order.promocode.discountValue),
      } : null,
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("[Admin Order GET Error]", error);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * Обновление заказа (только для администраторов)
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

    const isAdmin = user?.role?.code === "admin" || user?.role?.code === "manager" || user?.role?.code === "kitchen";
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
            product: {
              select: {
                id: true,
                title: true,
                price: true,
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
            phone: true,
          },
        },
        promocode: true,
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
        product: item.product ? {
          ...item.product,
          price: serializeBigInt(item.product.price),
        } : null,
      })),
      payments: updatedOrder.payments.map((payment) => ({
        ...payment,
        amount: serializeBigInt(payment.amount),
      })),
      promocode: updatedOrder.promocode ? {
        ...updatedOrder.promocode,
        discountValue: serializeBigInt(updatedOrder.promocode.discountValue),
      } : null,
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("[Admin Order PATCH Error]", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
