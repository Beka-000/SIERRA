import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeFileRecord } from "@/lib/bigint-utils";

/**
 * GET /api/cart
 * Получение корзины текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    // Для неавторизованных пользователей корзина хранится на клиенте
    if (!session) {
      return NextResponse.json({ items: [] });
    }

    // Загружаем корзину пользователя из БД
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                photoFile: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    // Форматируем данные для клиента
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      title: item.product.title,
      price: Number(item.product.price),
      quantity: item.quantity,
      imageUrl: item.product.photoFile?.url || null,
      weightOrVolume: item.product.weightOrVolume,
      modifiers: item.modifiers,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[Cart GET Error]", error);
    return NextResponse.json(
      { error: "Failed to load cart" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Добавление товара в корзину
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Проверяем существование и доступность товара
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isAvailable) {
      return NextResponse.json(
        { error: "Product not available" },
        { status: 400 }
      );
    }

    // Находим или создаём корзину пользователя
    let cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.userId },
      });
    }

    // Проверяем, есть ли товар в корзине
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    if (existingItem) {
      // Увеличиваем количество
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Создаём новую позицию
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cart POST Error]", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Очистка корзины
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Удаляем все товары из корзины
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: session.userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cart DELETE Error]", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
