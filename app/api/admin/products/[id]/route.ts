import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { serializeFileRecord } from "@/lib/bigint-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "products.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        photoFile: true,
        modifiers: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      price: Number(product.price),
      photoFile: product.photoFile ? serializeFileRecord(product.photoFile) : null,
      modifiers: product.modifiers.map((m) => ({
        ...m,
        priceDelta: Number(m.priceDelta),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "products.update");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.weightOrVolume !== undefined && { weightOrVolume: body.weightOrVolume }),
        ...(body.composition !== undefined && { composition: body.composition }),
        ...(body.calories !== undefined && { calories: body.calories }),
        ...(body.allergens !== undefined && { allergens: body.allergens }),
        ...(body.photoFileId !== undefined && { photoFileId: body.photoFileId }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
        ...(body.isRecommended !== undefined && { isRecommended: body.isRecommended }),
        ...(body.isHidden !== undefined && { isHidden: body.isHidden }),
        updatedAt: new Date(),
      },
      include: {
        category: true,
        photoFile: true,
      },
    });

    await createAuditLog({
      userId: auth.userId,
      action: "update",
      entityType: "product",
      entityId: id,
      details: { changes: body },
    });

    return NextResponse.json({ 
      ...updated, 
      price: Number(updated.price),
      photoFile: updated.photoFile ? serializeFileRecord(updated.photoFile) : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "products.delete");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    await createAuditLog({
      userId: auth.userId,
      action: "delete",
      entityType: "product",
      entityId: id,
      details: { title: product.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
