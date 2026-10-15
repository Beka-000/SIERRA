import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "promocodes.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const promocode = await prisma.promocode.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            promocode: {
              select: {
                code: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            totalAmount: true,
            discountAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        },
      },
    });

    if (!promocode) {
      return NextResponse.json(
        { error: "not_found", message: "Промокод не найден" },
        { status: 404 }
      );
    }

    // Вычисляем статистику
    const now = new Date();
    let status = "active";
    
    if (!promocode.isActive) {
      status = "inactive";
    } else if (new Date(promocode.validFrom) > now) {
      status = "scheduled";
    } else if (new Date(promocode.validUntil) < now) {
      status = "expired";
    } else if (promocode.usageLimit && promocode.usedCount >= promocode.usageLimit) {
      status = "depleted";
    }

    const totalDiscount = promocode.usages.reduce(
      (sum, usage) => sum + Number(usage.discountAmount),
      0
    );

    const totalRevenue = promocode.orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);

    return NextResponse.json({
      promocode: {
        ...promocode,
        discountValue: Number(promocode.discountValue),
        minOrderAmount: promocode.minOrderAmount ? Number(promocode.minOrderAmount) : null,
        maxDiscountAmount: promocode.maxDiscountAmount ? Number(promocode.maxDiscountAmount) : null,
        status,
        statistics: {
          totalDiscount: Number(totalDiscount.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          ordersCount: promocode.orders.length,
          completedOrdersCount: promocode.orders.filter((o) => o.status === "COMPLETED").length,
          usagesCount: promocode.usages.length,
          remainingUses: promocode.usageLimit
            ? Math.max(0, promocode.usageLimit - promocode.usedCount)
            : null,
          averageDiscount:
            promocode.usages.length > 0
              ? Number((totalDiscount / promocode.usages.length).toFixed(2))
              : 0,
        },
        orders: promocode.orders.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount),
          discountAmount: Number(o.discountAmount),
        })),
        usages: promocode.usages.map((u) => ({
          ...u,
          discountAmount: Number(u.discountAmount),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "promocodes.update");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      applicableProducts,
      applicableCategories,
      usageLimit,
      usesPerCustomer,
      firstOrderOnly,
      validFrom,
      validUntil,
      isActive,
    } = body;

    // Проверка существования промокода
    const existingPromocode = await prisma.promocode.findUnique({
      where: { id },
    });

    if (!existingPromocode) {
      return NextResponse.json(
        { error: "not_found", message: "Промокод не найден" },
        { status: 404 }
      );
    }

    // Валидация дат, если они изменяются
    if (validFrom && validUntil) {
      const fromDate = new Date(validFrom);
      const untilDate = new Date(validUntil);

      if (untilDate <= fromDate) {
        return NextResponse.json(
          { error: "validation_error", message: "Дата окончания должна быть позже даты начала" },
          { status: 400 }
        );
      }
    }

    // Валидация размера скидки
    if (discountValue !== undefined) {
      if (discountValue <= 0) {
        return NextResponse.json(
          { error: "validation_error", message: "Размер скидки должен быть больше 0" },
          { status: 400 }
        );
      }

      if (discountType === "percent" && discountValue > 100) {
        return NextResponse.json(
          { error: "validation_error", message: "Процентная скидка не может превышать 100%" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
    if (applicableProducts !== undefined) updateData.applicableProducts = applicableProducts;
    if (applicableCategories !== undefined) updateData.applicableCategories = applicableCategories;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (usesPerCustomer !== undefined) updateData.usesPerCustomer = usesPerCustomer;
    if (firstOrderOnly !== undefined) updateData.firstOrderOnly = firstOrderOnly;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPromocode = await prisma.promocode.update({
      where: { id },
      data: updateData,
    });

    // Логирование в аудит
    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "promocode.updated",
        entityType: "promocode",
        entityId: id,
        details: {
          code: updatedPromocode.code,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({
      message: "Промокод обновлён",
      promocode: {
        ...updatedPromocode,
        discountValue: Number(updatedPromocode.discountValue),
        minOrderAmount: updatedPromocode.minOrderAmount
          ? Number(updatedPromocode.minOrderAmount)
          : null,
        maxDiscountAmount: updatedPromocode.maxDiscountAmount
          ? Number(updatedPromocode.maxDiscountAmount)
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "promocodes.delete");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const promocode = await prisma.promocode.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!promocode) {
      return NextResponse.json(
        { error: "not_found", message: "Промокод не найден" },
        { status: 404 }
      );
    }

    // Если промокод использовался в заказах, лучше его деактивировать, а не удалять
    if (promocode._count.orders > 0) {
      return NextResponse.json(
        {
          error: "conflict",
          message: "Промокод использовался в заказах. Вместо удаления рекомендуется деактивировать его.",
          ordersCount: promocode._count.orders,
        },
        { status: 409 }
      );
    }

    await prisma.promocode.delete({
      where: { id },
    });

    // Логирование в аудит
    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "promocode.deleted",
        entityType: "promocode",
        entityId: id,
        details: {
          code: promocode.code,
        },
      },
    });

    return NextResponse.json({
      message: "Промокод удалён",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
