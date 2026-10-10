import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d"; // 1d, 7d, 30d, 90d

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "7d":
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Статистика заказов
    const [totalOrders, totalOrdersPrevious] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
            lt: startDate,
          },
        },
      }),
    ]);

    const ordersChange =
      totalOrdersPrevious === 0
        ? 100
        : ((totalOrders - totalOrdersPrevious) / totalOrdersPrevious) * 100;

    // Выручка
    const revenueData = await prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { totalAmount: true },
    });

    const revenuePreviousData = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
          lt: startDate,
        },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { totalAmount: true },
    });

    const revenue = Number(revenueData._sum.totalAmount || 0);
    const revenuePrevious = Number(revenuePreviousData._sum.totalAmount || 0);
    const revenueChange =
      revenuePrevious === 0 ? 100 : ((revenue - revenuePrevious) / revenuePrevious) * 100;

    // Средний чек
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    // Новые клиенты
    const newCustomers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
        roleId: { not: "" }, // фильтруем по role если нужно
      },
    });

    // Статусы заказов
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    });

    const statusCounts = {
      NEW: 0,
      CONFIRMED: 0,
      COOKING: 0,
      READY: 0,
      OUT_FOR_DELIVERY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    ordersByStatus.forEach((item) => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count.id;
    });

    // График заказов по дням
    const ordersOverTime = await getOrdersOverTime(startDate, now);

    // Топ товары
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { notIn: ["CANCELLED"] },
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, title: true, price: true },
        });
        return {
          id: product?.id || item.productId,
          name: product?.title || "Неизвестный товар",
          quantity: item._sum.quantity || 0,
          orders: item._count.id,
          revenue: Number(product?.price || 0) * (item._sum.quantity || 0),
        };
      })
    );

    // Последние заказы
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      period,
      stats: {
        totalOrders,
        ordersChange: Math.round(ordersChange),
        revenue,
        revenueChange: Math.round(revenueChange),
        avgOrderValue: Math.round(avgOrderValue),
        newCustomers,
      },
      statusCounts,
      ordersOverTime,
      topProducts: topProductsWithDetails,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function getOrdersOverTime(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  // Группируем по дням
  const dayMap = new Map<string, { count: number; revenue: number }>();

  orders.forEach((order) => {
    const day = order.createdAt.toISOString().split("T")[0];
    const existing = dayMap.get(day) || { count: 0, revenue: 0 };
    dayMap.set(day, {
      count: existing.count + 1,
      revenue: existing.revenue + Number(order.totalAmount),
    });
  });

  // Заполняем пропущенные дни
  const result: { date: string; orders: number; revenue: number }[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    const data = dayMap.get(dateStr) || { count: 0, revenue: 0 };
    result.push({
      date: dateStr,
      orders: data.count,
      revenue: Math.round(data.revenue),
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}
