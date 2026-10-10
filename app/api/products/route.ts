import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products
 * Получение списка товаров с фильтрацией, поиском и сортировкой
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'default';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isRecommended = searchParams.get('recommended') === 'true';

    // Формирование where условий
    const where: any = {
      isHidden: false,
      isAvailable: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isRecommended) {
      where.isRecommended = true;
    }

    // Формирование сортировки
    let orderBy: any = { createdAt: 'desc' };
    
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { title: 'asc' };
        break;
      case 'name_desc':
        orderBy = { title: 'desc' };
        break;
      case 'recommended':
        orderBy = [{ isRecommended: 'desc' }, { createdAt: 'desc' }];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Подсчет общего количества
    const total = await prisma.product.count({ where });

    // Получение товаров с пагинацией
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
        },
      },
    });

    // Форматирование ответа
    const formattedProducts = products.map((product) => ({
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
      isRecommended: product.isRecommended,
      category: product.category,
      modifiers: product.modifiers.map((m) => ({
        id: m.id,
        title: m.title,
        priceDelta: Number(m.priceDelta),
      })),
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
