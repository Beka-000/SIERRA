import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/cart/[productId]
 * Обновление количества товара в корзине
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { productId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    // Находим корзину пользователя
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
    });

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    // Если количество 0, удаляем товар
    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: productId,
        },
      });
      return NextResponse.json({ success: true });
    }

    // Обновляем количество
    await prisma.cartItem.updateMany({
      where: {
        cartId: cart.id,
        productId: productId,
      },
      data: { quantity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cart PATCH Error]", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[productId]
 * Удаление товара из корзины
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { productId } = await params;

    // Находим корзину пользователя
    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
    });

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    // Удаляем товар
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cart DELETE Error]", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
