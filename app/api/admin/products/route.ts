import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "products.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search") || "";
    const isAvailable = searchParams.get("isAvailable");

    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (isAvailable !== null && isAvailable !== undefined) {
      where.isAvailable = isAvailable === "true";
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        photoFile: true,
        _count: {
          select: { modifiers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "products.create");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      categoryId,
      title,
      description,
      price,
      weightOrVolume,
      allergens,
      photoFileId,
      isAvailable = true,
      isRecommended = false,
      isHidden = false,
    } = body;

    if (!categoryId || !title || !price) {
      return NextResponse.json(
        { error: "validation_error", message: "Категория, название и цена обязательны" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        title,
        description,
        price,
        weightOrVolume,
        allergens,
        photoFileId,
        isAvailable,
        isRecommended,
        isHidden,
      },
      include: {
        category: true,
      },
    });

    await createAuditLog({
      userId: auth.userId,
      action: "create",
      entityType: "product",
      entityId: product.id,
      details: { title, price },
    });

    return NextResponse.json(
      { ...product, price: Number(product.price) },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
