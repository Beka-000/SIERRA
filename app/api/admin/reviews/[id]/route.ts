import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "reviews.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            googleAvatar: true,
            profile: {
              select: {
                avatarFile: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            photoFile: {
              select: {
                url: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "not_found", message: "Отзыв не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      review: {
        ...review,
        userAvatar:
          review.user?.profile?.avatarFile?.url ||
          review.user?.googleAvatar ||
          null,
        productPhoto: review.product?.photoFile?.url || null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "reviews.moderate");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        product: { select: { title: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "not_found", message: "Отзыв не найден" },
        { status: 404 }
      );
    }

    let updatedReview;
    let actionMessage = "";

    switch (action) {
      case "approve":
        updatedReview = await prisma.review.update({
          where: { id },
          data: {
            status: "approved",
            isPublished: true,
            moderatedBy: auth.userId,
            moderatedAt: new Date(),
            rejectionReason: null,
          },
        });
        actionMessage = "Отзыв одобрен и опубликован";

        // Логирование
        await prisma.activityLog.create({
          data: {
            userId: auth.userId,
            action: "review.approved",
            entityType: "review",
            entityId: id,
            details: {
              reviewer: review.user?.name,
              product: review.product?.title,
              rating: review.rating,
            },
          },
        });
        break;

      case "reject":
        if (!rejectionReason) {
          return NextResponse.json(
            { error: "validation_error", message: "Укажите причину отклонения" },
            { status: 400 }
          );
        }

        updatedReview = await prisma.review.update({
          where: { id },
          data: {
            status: "rejected",
            isPublished: false,
            moderatedBy: auth.userId,
            moderatedAt: new Date(),
            rejectionReason,
          },
        });
        actionMessage = "Отзыв отклонён";

        // Логирование
        await prisma.activityLog.create({
          data: {
            userId: auth.userId,
            action: "review.rejected",
            entityType: "review",
            entityId: id,
            details: {
              reviewer: review.user?.name,
              product: review.product?.title,
              reason: rejectionReason,
            },
          },
        });
        break;

      case "hide":
        updatedReview = await prisma.review.update({
          where: { id },
          data: {
            status: "hidden",
            isPublished: false,
            moderatedBy: auth.userId,
            moderatedAt: new Date(),
          },
        });
        actionMessage = "Отзыв скрыт";

        // Логирование
        await prisma.activityLog.create({
          data: {
            userId: auth.userId,
            action: "review.hidden",
            entityType: "review",
            entityId: id,
            details: {
              reviewer: review.user?.name,
              product: review.product?.title,
            },
          },
        });
        break;

      case "restore":
        updatedReview = await prisma.review.update({
          where: { id },
          data: {
            status: "pending",
            isPublished: false,
            moderatedBy: null,
            moderatedAt: null,
            rejectionReason: null,
          },
        });
        actionMessage = "Отзыв восстановлен в статус 'На модерации'";

        // Логирование
        await prisma.activityLog.create({
          data: {
            userId: auth.userId,
            action: "review.restored",
            entityType: "review",
            entityId: id,
            details: {
              reviewer: review.user?.name,
              product: review.product?.title,
            },
          },
        });
        break;

      default:
        return NextResponse.json(
          {
            error: "validation_error",
            message: "Неверное действие. Используйте: approve, reject, hide, restore",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: actionMessage,
      review: updatedReview,
    });
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

    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        user: { select: { name: true } },
        product: { select: { title: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "not_found", message: "Отзыв не найден" },
        { status: 404 }
      );
    }

    await prisma.review.delete({ where: { id } });

    // Логирование
    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "review.deleted",
        entityType: "review",
        entityId: id,
        details: {
          reviewer: review.user?.name,
          product: review.product?.title,
        },
      },
    });

    return NextResponse.json({ message: "Отзыв удалён" });
  } catch (error) {
    return handleApiError(error);
  }
}
