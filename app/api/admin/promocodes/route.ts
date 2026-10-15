import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "promocodes.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");
    const status = searchParams.get("status"); // active, expired, scheduled, depleted
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    // Поиск по коду или названию
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Фильтр по активности
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Фильтр по статусу
    const now = new Date();
    if (status === "active") {
      where.isActive = true;
      where.validFrom = { lte: now };
      where.validUntil = { gte: now };
    } else if (status === "expired") {
      where.validUntil = { lt: now };
    } else if (status === "scheduled") {
      where.validFrom = { gt: now };
    } else if (status === "depleted") {
      where.usedCount = { gte: prisma.promocode.fields.usageLimit };
    }

    const total = await prisma.promocode.count({ where });

    const promocodes = await prisma.promocode.findMany({
      where,
      include: {
        usages: {
          select: {
            id: true,
            discountAmount: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            usages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Форматируем данные и определяем статус
    const formattedPromocodes = promocodes.map((p) => {
      let computedStatus = "active";
      
      if (!p.isActive) {
        computedStatus = "inactive";
      } else if (new Date(p.validFrom) > now) {
        computedStatus = "scheduled";
      } else if (new Date(p.validUntil) < now) {
        computedStatus = "expired";
      } else if (p.usageLimit && p.usedCount >= p.usageLimit) {
        computedStatus = "depleted";
      }

      const totalDiscount = p.usages.reduce(
        (sum, usage) => sum + Number(usage.discountAmount),
        0
      );

      return {
        ...p,
        discountValue: Number(p.discountValue),
        minOrderAmount: p.minOrderAmount ? Number(p.minOrderAmount) : null,
        maxDiscountAmount: p.maxDiscountAmount ? Number(p.maxDiscountAmount) : null,
        status: computedStatus,
        totalDiscount: Number(totalDiscount.toFixed(2)),
        ordersCount: p._count.orders,
        usagesCount: p._count.usages,
        remainingUses: p.usageLimit ? Math.max(0, p.usageLimit - p.usedCount) : null,
      };
    });

    return NextResponse.json({
      promocodes: formattedPromocodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "promocodes.create");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      applicableProducts = [],
      applicableCategories = [],
      usageLimit,
      usesPerCustomer,
      firstOrderOnly = false,
      validFrom,
      validUntil,
      isActive = true,
    } = body;

    // Валидация обязательных полей
    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "validation_error", message: "Обязательные поля: code, discountType, discountValue, validFrom, validUntil" },
        { status: 400 }
      );
    }

    // Валидация типа скидки
    if (!["percent", "fixed"].includes(discountType)) {
      return NextResponse.json(
        { error: "validation_error", message: "discountType должен быть 'percent' или 'fixed'" },
        { status: 400 }
      );
    }

    // Валидация значения скидки
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

    // Валидация дат
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    if (untilDate <= fromDate) {
      return NextResponse.json(
        { error: "validation_error", message: "Дата окончания должна быть позже даты начала" },
        { status: 400 }
      );
    }

    // Проверка уникальности кода
    const normalizedCode = code.trim().toUpperCase();
    const existingPromocode = await prisma.promocode.findUnique({
      where: { code: normalizedCode },
    });

    if (existingPromocode) {
      return NextResponse.json(
        { error: "duplicate_error", message: "Промокод с таким кодом уже существует" },
        { status: 409 }
      );
    }

    const promocode = await prisma.promocode.create({
      data: {
        code: normalizedCode,
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
        validFrom: fromDate,
        validUntil: untilDate,
        isActive,
      },
    });

    // Логирование в аудит
    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "promocode.created",
        entityType: "promocode",
        entityId: promocode.id,
        details: {
          code: normalizedCode,
          discountType,
          discountValue: Number(discountValue),
        },
      },
    });

    return NextResponse.json(
      {
        ...promocode,
        discountValue: Number(promocode.discountValue),
        minOrderAmount: promocode.minOrderAmount ? Number(promocode.minOrderAmount) : null,
        maxDiscountAmount: promocode.maxDiscountAmount ? Number(promocode.maxDiscountAmount) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
