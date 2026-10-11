import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint-utils";

/**
 * GET /api/admin/orders
 * Получение списка всех заказов (только для администраторов)
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const fulfillmentType = searchParams.get("fulfillmentType") || "";
    const paymentMethod = searchParams.get("paymentMethod") || "";

    // Формируем условия фильтрации
    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (fulfillmentType) {
      where.fulfillmentType = fulfillmentType;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Получаем заказы с пагинацией
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
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
            take: 1,
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

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
      })),
      payments: order.payments.map((payment) => ({
        ...payment,
        amount: serializeBigInt(payment.amount),
      })),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      orders: serializedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[Admin Orders GET Error]", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
