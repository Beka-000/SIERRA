import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "categories.update");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, sortOrder, isActive } = body;

    const existing = await prisma.menuCategory.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await createAuditLog({
      userId: auth.userId,
      action: "update",
      entityType: "category",
      entityId: id,
      details: { changes: body },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "categories.delete");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: "has_products", message: "Невозможно удалить категорию с товарами" },
        { status: 400 }
      );
    }

    await prisma.menuCategory.delete({ where: { id } });

    await createAuditLog({
      userId: auth.userId,
      action: "delete",
      entityType: "category",
      entityId: id,
      details: { title: category.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
