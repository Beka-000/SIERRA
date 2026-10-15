import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ValidationResult {
  valid: boolean;
  error?: string;
  promocode?: any;
  discountAmount?: number;
}

async function validatePromocode(
  code: string,
  userId: string | null,
  cartTotal: number,
  cartItems: any[]
): Promise<ValidationResult> {
  // Нормализация кода
  const normalizedCode = code.trim().toUpperCase();

  // Поиск промокода
  const promocode = await prisma.promocode.findUnique({
    where: { code: normalizedCode },
  });

  if (!promocode) {
    return { valid: false, error: "Промокод не найден" };
  }

  // Проверка активности
  if (!promocode.isActive) {
    return { valid: false, error: "Промокод неактивен" };
  }

  // Проверка дат
  const now = new Date();
  if (new Date(promocode.validFrom) > now) {
    return { valid: false, error: "Промокод ещё не начал действовать" };
  }

  if (new Date(promocode.validUntil) < now) {
    return { valid: false, error: "Срок действия промокода истёк" };
  }

  // Проверка общего лимита использований
  if (promocode.usageLimit && promocode.usedCount >= promocode.usageLimit) {
    return { valid: false, error: "Исчерпан лимит использований промокода" };
  }

  // Проверка минимальной суммы заказа
  if (promocode.minOrderAmount && cartTotal < Number(promocode.minOrderAmount)) {
    return {
      valid: false,
      error: `Минимальная сумма заказа для применения промокода: ${Number(promocode.minOrderAmount)} с`,
    };
  }

  // Проверка лимита на пользователя (если пользователь авторизован)
  if (userId && promocode.usesPerCustomer) {
    const userUsageCount = await prisma.promocodeUsage.count({
      where: {
        promocodeId: promocode.id,
        userId: userId,
      },
    });

    if (userUsageCount >= promocode.usesPerCustomer) {
      return {
        valid: false,
        error: `Вы уже использовали этот промокод максимальное количество раз (${promocode.usesPerCustomer})`,
      };
    }
  }

  // Проверка "только для первого заказа"
  if (userId && promocode.firstOrderOnly) {
    const userOrdersCount = await prisma.order.count({
      where: {
        userId: userId,
        status: { in: ["COMPLETED", "READY", "OUT_FOR_DELIVERY", "COOKING"] },
      },
    });

    if (userOrdersCount > 0) {
      return {
        valid: false,
        error: "Этот промокод действителен только для первого заказа",
      };
    }
  }

  // Проверка применимых товаров и категорий
  if (
    promocode.applicableProducts.length > 0 ||
    promocode.applicableCategories.length > 0
  ) {
    const hasApplicableItems = cartItems.some((item: any) => {
      // Проверяем, есть ли товар в списке применимых
      if (promocode.applicableProducts.includes(item.productId)) {
        return true;
      }
      // Проверяем категорию товара
      if (
        item.product?.categoryId &&
        promocode.applicableCategories.includes(item.product.categoryId)
      ) {
        return true;
      }
      return false;
    });

    if (!hasApplicableItems) {
      return {
        valid: false,
        error: "В корзине нет товаров, к которым применим этот промокод",
      };
    }

    // Рассчитываем скидку только для применимых товаров
    let applicableTotal = 0;
    cartItems.forEach((item: any) => {
      if (
        promocode.applicableProducts.includes(item.productId) ||
        (item.product?.categoryId &&
          promocode.applicableCategories.includes(item.product.categoryId))
      ) {
        applicableTotal += Number(item.unitPrice) * item.quantity;
      }
    });

    // Вычисляем размер скидки
    let discountAmount = 0;
    if (promocode.discountType === "percent") {
      discountAmount = (applicableTotal * Number(promocode.discountValue)) / 100;
      // Применяем максимальную скидку, если установлена
      if (promocode.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(promocode.maxDiscountAmount));
      }
    } else {
      discountAmount = Number(promocode.discountValue);
    }

    // Скидка не может превышать применимую сумму
    discountAmount = Math.min(discountAmount, applicableTotal);

    return {
      valid: true,
      promocode,
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }

  // Если ограничений по товарам нет, применяем ко всей сумме
  let discountAmount = 0;
  if (promocode.discountType === "percent") {
    discountAmount = (cartTotal * Number(promocode.discountValue)) / 100;
    // Применяем максимальную скидку, если установлена
    if (promocode.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, Number(promocode.maxDiscountAmount));
    }
  } else {
    discountAmount = Number(promocode.discountValue);
  }

  // Скидка не может превышать сумму заказа
  discountAmount = Math.min(discountAmount, cartTotal);

  return {
    valid: true,
    promocode,
    discountAmount: Number(discountAmount.toFixed(2)),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, cartItems } = body;

    if (!code) {
      return NextResponse.json(
        { error: "validation_error", message: "Код промокода обязателен" },
        { status: 400 }
      );
    }

    if (!cartTotal || cartTotal <= 0) {
      return NextResponse.json(
        { error: "validation_error", message: "Сумма корзины должна быть больше 0" },
        { status: 400 }
      );
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "validation_error", message: "Корзина пуста" },
        { status: 400 }
      );
    }

    // Получаем userId из сессии (если есть)
    let userId: string | null = null;
    const token = request.cookies.get("sc_session")?.value;
    if (token) {
      const session = await verifySession(token);
      if (session && session.userId) {
        userId = session.userId;
      }
    }

    // Валидация промокода
    const result = await validatePromocode(code, userId, cartTotal, cartItems);

    if (!result.valid) {
      return NextResponse.json(
        { error: "invalid_promocode", message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      promocode: {
        id: result.promocode!.id,
        code: result.promocode!.code,
        name: result.promocode!.name,
        discountType: result.promocode!.discountType,
        discountValue: Number(result.promocode!.discountValue),
      },
      discountAmount: result.discountAmount!,
      newTotal: Number((cartTotal - result.discountAmount!).toFixed(2)),
    });
  } catch (error) {
    console.error("[Apply Promocode Error]", error);
    return NextResponse.json(
      { error: "server_error", message: "Ошибка при проверке промокода" },
      { status: 500 }
    );
  }
}
