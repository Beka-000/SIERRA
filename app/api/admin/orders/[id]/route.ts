import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { OrderStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "orders.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
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
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        product: item.product
          ? {
              ...item.product,
              price: Number(item.product.price),
            }
          : null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "orders.update");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: "invalid_status", message: "Невалидный статус заказа" },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({ where: { id } });

    if (!existingOrder) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    // Audit log
    await createAuditLog({
      userId: auth.userId,
      action: "status_change",
      entityType: "order",
      entityId: id,
      details: {
        oldStatus: existingOrder.status,
        newStatus: status,
      },
    });

    return NextResponse.json({
      ...updatedOrder,
      subtotal: Number(updatedOrder.subtotal),
      discountAmount: Number(updatedOrder.discountAmount),
      totalAmount: Number(updatedOrder.totalAmount),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "orders.delete");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    await prisma.order.delete({ where: { id } });

    // Audit log
    await createAuditLog({
      userId: auth.userId,
      action: "delete",
      entityType: "order",
      entityId: id,
      details: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
