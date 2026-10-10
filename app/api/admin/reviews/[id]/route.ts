import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "reviews.moderate");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { isPublished } = body;

    const review = await prisma.review.update({
      where: { id },
      data: { isPublished },
    });

    await createAuditLog({
      userId: auth.userId,
      action: "update",
      entityType: "review" as any,
      entityId: id,
      details: { isPublished },
    });

    return NextResponse.json(review);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "reviews.delete");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    await prisma.review.delete({ where: { id } });

    await createAuditLog({
      userId: auth.userId,
      action: "delete",
      entityType: "review" as any,
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
