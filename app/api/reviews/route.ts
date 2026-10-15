import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const where: any = {
      status: "approved",
      isPublished: true,
    };

    if (productId) {
      where.productId = productId;
    }

    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            googleAvatar: true,
            profile: {
              select: {
                avatarFile: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Форматируем отзывы
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      user: {
        name: review.user?.name || "Аноним",
        avatar:
          review.user?.profile?.avatarFile?.url ||
          review.user?.googleAvatar ||
          null,
      },
      product: review.product
        ? {
            id: review.product.id,
            title: review.product.title,
          }
        : null,
    }));

    // Вычисляем средний рейтинг
    let averageRating = 0;
    if (productId && reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      averageRating = Number((sum / reviews.length).toFixed(1));
    }

    return NextResponse.json({
      reviews: formattedReviews,
      averageRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Get Reviews Error]", error);
    return NextResponse.json(
      { error: "server_error", message: "Ошибка при получении отзывов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем сессию пользователя
    const token = request.cookies.get("sc_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "unauthorized", message: "Требуется авторизация для написания отзыва" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "unauthorized", message: "Невалидная сессия" },
        { status: 401 }
      );
    }

    // Проверяем, не заблокирован ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        isBlocked: true,
      },
    });

    if (user?.isBlocked) {
      return NextResponse.json(
        { error: "forbidden", message: "Ваш аккаунт заблокирован" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productId, orderId, rating, text } = body;

    // Валидация
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "validation_error", message: "Рейтинг должен быть от 1 до 5" },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: "validation_error", message: "Текст отзыва должен содержать минимум 10 символов" },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: "validation_error", message: "Текст отзыва не может превышать 1000 символов" },
        { status: 400 }
      );
    }

    // Если указан productId, проверяем его существование
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: "not_found", message: "Товар не найден" },
          { status: 404 }
        );
      }

      // Проверяем, не оставлял ли пользователь уже отзыв на этот товар
      const existingReview = await prisma.review.findFirst({
        where: {
          userId: session.userId,
          productId: productId,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "duplicate_error", message: "Вы уже оставили отзыв на этот товар" },
          { status: 409 }
        );
      }
    }

    // Если указан orderId, проверяем, что заказ принадлежит пользователю и выполнен
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return NextResponse.json(
          { error: "not_found", message: "Заказ не найден" },
          { status: 404 }
        );
      }

      if (order.userId !== session.userId) {
        return NextResponse.json(
          { error: "forbidden", message: "Это не ваш заказ" },
          { status: 403 }
        );
      }

      if (order.status !== "COMPLETED") {
        return NextResponse.json(
          {
            error: "validation_error",
            message: "Отзыв можно оставить только после выполнения заказа",
          },
          { status: 400 }
        );
      }
    }

    // Создаём отзыв
    const review = await prisma.review.create({
      data: {
        userId: session.userId,
        productId: productId || null,
        orderId: orderId || null,
        rating,
        text: text.trim(),
        status: "pending",
        isPublished: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            googleAvatar: true,
            profile: {
              select: {
                avatarFile: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Спасибо за ваш отзыв! Он будет опубликован после модерации.",
        review: {
          id: review.id,
          rating: review.rating,
          text: review.text,
          status: review.status,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Create Review Error]", error);
    return NextResponse.json(
      { error: "server_error", message: "Ошибка при создании отзыва" },
      { status: 500 }
    );
  }
}
