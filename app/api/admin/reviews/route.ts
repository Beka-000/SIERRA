import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "reviews.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const isPublished = searchParams.get("isPublished");

    const where: any = {};
    if (isPublished !== null && isPublished !== undefined) {
      where.isPublished = isPublished === "true";
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
        product: {
          select: { id: true, title: true },
        },
        order: {
          select: { id: true, orderNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    return handleApiError(error);
  }
}
