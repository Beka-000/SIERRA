import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/categories
 * Получение списка активных категорий с количеством товаров
 */
export async function GET() {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isHidden: false,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      title: category.title,
      description: category.description,
      imageUrl: category.imageUrl,
      productsCount: category._count.products,
    }));

    return NextResponse.json({
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
