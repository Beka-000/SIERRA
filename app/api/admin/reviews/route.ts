import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "reviews.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // pending, approved, rejected, hidden
    const rating = searchParams.get("rating");
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    // Поиск по тексту или имени автора
    if (search) {
      where.OR = [
        { text: { contains: search, mode: "insensitive" } },
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Фильтр по статусу
    if (status) {
      where.status = status;
    }

    // Фильтр по рейтингу
    if (rating) {
      where.rating = parseInt(rating);
    }

    // Фильтр по товару
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
            email: true,
            phone: true,
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
            photoFile: {
              select: {
                url: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedReviews = reviews.map((review) => ({
      ...review,
      userAvatar:
        review.user?.profile?.avatarFile?.url ||
        review.user?.googleAvatar ||
        null,
      productPhoto: review.product?.photoFile?.url || null,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
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
