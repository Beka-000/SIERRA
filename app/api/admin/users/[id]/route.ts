import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { canAssignRole } from "@/lib/permissions";

// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "users.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: { select: { id: true, code: true, title: true } },
        profile: {
          include: { avatarFile: { select: { url: true } } },
        },
        orders: {
          include: {
            items: {
              include: { product: { select: { title: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        blockedByUser: { select: { id: true, name: true, email: true } },
        loyaltyAccount: {
          include: {
            transactions: { orderBy: { createdAt: "desc" }, take: 20 },
          },
        },
        reviews: {
          include: { product: { select: { id: true, title: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "not_found", message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const completedOrders = user.orders.filter((o) => o.status === "COMPLETED");
    const totalSpent = completedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );
    const averageOrderValue =
      completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;

    let onlineStatus = "offline";
    let lastSeenText = "Никогда";
    if (user.lastSeenAt) {
      const diffMinutes = Math.floor(
        (Date.now() - new Date(user.lastSeenAt).getTime()) / 60000
      );
      if (diffMinutes < 2)          { onlineStatus = "online"; lastSeenText = "В сети"; }
      else if (diffMinutes < 60)    lastSeenText = `${diffMinutes} мин назад`;
      else if (diffMinutes < 1440)  lastSeenText = `${Math.floor(diffMinutes / 60)} ч назад`;
      else if (diffMinutes < 2880)  lastSeenText = "Вчера";
      else                          lastSeenText = `${Math.floor(diffMinutes / 1440)} дн назад`;
    }

    // Загружаем все роли для UI смены роли
    const allRoles = await prisma.role.findMany({
      orderBy: { title: "asc" },
      select: { id: true, code: true, title: true },
    });

    return NextResponse.json({
      user: {
        ...user,
        avatar: user.profile?.avatarFile?.url || user.googleAvatar || null,
        onlineStatus,
        lastSeenText,
        statistics: {
          ordersCount: user.orders.length,
          completedOrdersCount: completedOrders.length,
          cancelledOrdersCount: user.orders.filter((o) => o.status === "CANCELLED").length,
          totalSpent: Number(totalSpent.toFixed(2)),
          averageOrderValue: Number(averageOrderValue.toFixed(2)),
          reviewsCount: user.reviews.length,
          loyaltyBalance: user.loyaltyAccount
            ? Number(user.loyaltyAccount.balance)
            : 0,
        },
        orders: user.orders.map((order) => ({
          ...order,
          subtotal:        Number(order.subtotal),
          discountAmount:  Number(order.discountAmount),
          totalAmount:     Number(order.totalAmount),
        })),
      },
      allRoles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─── PATCH /api/admin/users/[id] ─────────────────────────────────────────────
// action: "change_role" — смена роли пользователя

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Смена роли требует отдельного permission
  const auth = await requireAuth(request, "users.assign_role");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: targetUserId } = await params;
    const body = await request.json();
    const { action, newRoleCode } = body as {
      action: string;
      newRoleCode?: string;
    };

    if (action !== "change_role") {
      return NextResponse.json(
        { error: "invalid_action", message: "Неизвестное действие" },
        { status: 400 }
      );
    }

    if (!newRoleCode || typeof newRoleCode !== "string") {
      return NextResponse.json(
        { error: "validation_error", message: "newRoleCode обязателен" },
        { status: 400 }
      );
    }

    // ── Проверка 1: нельзя менять роль самому себе ──────────────────────────
    if (targetUserId === auth.userId) {
      return NextResponse.json(
        {
          error: "forbidden",
          message: "Нельзя изменить свою собственную роль",
        },
        { status: 403 }
      );
    }

    // ── Проверка 2: только admin может назначать роли ───────────────────────
    if (!canAssignRole(auth.role, newRoleCode)) {
      return NextResponse.json(
        {
          error: "forbidden",
          message: "У вас нет прав для назначения этой роли",
        },
        { status: 403 }
      );
    }

    // ── Загружаем целевого пользователя и новую роль из БД ──────────────────
    const [targetUser, newRole] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        include: { role: true },
      }),
      prisma.role.findUnique({ where: { code: newRoleCode } }),
    ]);

    if (!targetUser) {
      return NextResponse.json(
        { error: "not_found", message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    if (!newRole) {
      return NextResponse.json(
        { error: "not_found", message: `Роль «${newRoleCode}» не найдена в базе данных` },
        { status: 404 }
      );
    }

    // ── Проверка 3: нет смысла менять на ту же роль ─────────────────────────
    if (targetUser.roleId === newRole.id) {
      return NextResponse.json(
        { error: "no_change", message: "Пользователь уже имеет эту роль" },
        { status: 400 }
      );
    }

    // ── Проверка 4: нельзя понизить последнего активного администратора ─────
    if (targetUser.role.code === "admin" && newRoleCode !== "admin") {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: { code: "admin" },
          isBlocked: false,
        },
      });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            error: "forbidden",
            message:
              "Нельзя понизить роль последнего активного администратора. Сначала назначьте другого администратора.",
          },
          { status: 403 }
        );
      }
    }

    const oldRoleCode  = targetUser.role.code;
    const oldRoleTitle = targetUser.role.title;

    // ── Обновляем роль ───────────────────────────────────────────────────────
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data:  { roleId: newRole.id },
      include: {
        role: { select: { id: true, code: true, title: true } },
      },
    });

    // ── Пишем в аудит ────────────────────────────────────────────────────────
    await prisma.activityLog.create({
      data: {
        userId:     auth.userId,
        action:     "update",
        entityType: "user",
        entityId:   targetUserId,
        details: {
          type:         "role_changed",
          targetUser:   targetUser.name,
          targetEmail:  targetUser.email,
          oldRole:      oldRoleCode,
          oldRoleTitle: oldRoleTitle,
          newRole:      newRoleCode,
          newRoleTitle: newRole.title,
          changedBy:    auth.userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Роль пользователя ${targetUser.name} изменена с «${oldRoleTitle}» на «${newRole.title}»`,
      user: {
        id:   updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
