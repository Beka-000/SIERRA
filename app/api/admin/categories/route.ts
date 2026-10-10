import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "categories.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "categories.create");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, sortOrder = 0, isActive = true } = body;

    if (!title) {
      return NextResponse.json(
        { error: "validation_error", message: "Название обязательно" },
        { status: 400 }
      );
    }

    const category = await prisma.menuCategory.create({
      data: {
        title,
        sortOrder,
        isActive,
      },
    });

    await createAuditLog({
      userId: auth.userId,
      action: "create",
      entityType: "category",
      entityId: category.id,
      details: { title },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
