import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "promocodes.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const promocodes = await prisma.promocode.findMany({
      where,
      orderBy: { validFrom: "desc" },
    });

    return NextResponse.json({
      promocodes: promocodes.map((p) => ({
        ...p,
        discountValue: Number(p.discountValue),
        minOrderAmount: p.minOrderAmount ? Number(p.minOrderAmount) : null,
      })),
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
      discountType,
      discountValue,
      minOrderAmount,
      applicableProducts = [],
      applicableCategories = [],
      usageLimit,
      validFrom,
      validUntil,
      isActive = true,
    } = body;

    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "validation_error", message: "Обязательные поля не заполнены" },
        { status: 400 }
      );
    }

    const promocode = await prisma.promocode.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        applicableProducts,
        applicableCategories,
        usageLimit,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isActive,
      },
    });

    return NextResponse.json(
      {
        ...promocode,
        discountValue: Number(promocode.discountValue),
        minOrderAmount: promocode.minOrderAmount ? Number(promocode.minOrderAmount) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
