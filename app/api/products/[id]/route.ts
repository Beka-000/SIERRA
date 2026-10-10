import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/[id]
 * Получение детальной информации о товаре
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            title: true,
          },
        },
        photoFile: {
          select: {
            url: true,
          },
        },
        modifiers: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            title: true,
            priceDelta: true,
          },
          orderBy: {
            priceDelta: 'asc',
          },
        },
        reviews: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            rating: true,
            text: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Проверка доступности
    if (product.isHidden && !request.headers.get('x-admin-access')) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Расчет среднего рейтинга
    const averageRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    // Получение похожих товаров
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isHidden: false,
        isAvailable: true,
      },
      take: 4,
      include: {
        photoFile: {
          select: {
            url: true,
          },
        },
      },
    });

    // Форматирование ответа
    const formattedProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      weightOrVolume: product.weightOrVolume,
      calories: product.calories,
      allergens: product.allergens,
      composition: product.composition,
      imageUrl: product.photoFile?.url || null,
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      category: product.category,
      modifiers: product.modifiers.map((m) => ({
        id: m.id,
        title: m.title,
        priceDelta: Number(m.priceDelta),
      })),
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        userName: r.user?.name || 'Аноним',
        createdAt: r.createdAt.toISOString(),
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      reviewsCount: product.reviews.length,
      relatedProducts: relatedProducts.map((p) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        imageUrl: p.photoFile?.url || null,
      })),
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
