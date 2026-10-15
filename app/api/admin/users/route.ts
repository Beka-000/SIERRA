import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "users.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roleId   = searchParams.get("roleId");
    const roleCode = searchParams.get("roleCode");
    const isBlocked = searchParams.get("isBlocked");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Построение where условий
    const where: any = {};

    // Поиск по имени, email или телефону
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Фильтр по роли (по ID или по code)
    if (roleCode) {
      where.role = { code: roleCode };
    } else if (roleId) {
      where.roleId = roleId;
    }

    // Фильтр по статусу блокировки
    if (isBlocked !== null && isBlocked !== undefined) {
      where.isBlocked = isBlocked === "true";
    }

    // Получаем общее количество для пагинации
    const total = await prisma.user.count({ where });

    // Получаем пользователей с пагинацией
    const users = await prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        profile: {
          select: {
            avatarFile: {
              select: {
                url: true,
              },
            },
          },
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
        blockedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Форматируем данные
    const formattedUsers = users.map((user) => {
      const completedOrders = user.orders.filter((o) => o.status === "COMPLETED");
      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );

      // Определение онлайн статуса
      let onlineStatus = "offline";
      let lastSeenText = "Никогда";

      if (user.lastSeenAt) {
        const now = new Date();
        const lastSeen = new Date(user.lastSeenAt);
        const diffMs = now.getTime() - lastSeen.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);

        if (diffMinutes < 2) {
          onlineStatus = "online";
          lastSeenText = "В сети";
        } else if (diffMinutes < 60) {
          lastSeenText = `${diffMinutes} мин назад`;
        } else if (diffMinutes < 1440) {
          const hours = Math.floor(diffMinutes / 60);
          lastSeenText = `${hours} ч назад`;
        } else if (diffMinutes < 2880) {
          lastSeenText = "Вчера";
        } else {
          const days = Math.floor(diffMinutes / 1440);
          lastSeenText = `${days} дн назад`;
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.profile?.avatarFile?.url || user.googleAvatar || null,
        role: user.role,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason,
        blockedAt: user.blockedAt,
        blockedBy: user.blockedByUser,
        lastSeenAt: user.lastSeenAt,
        onlineStatus,
        lastSeenText,
        ordersCount: user.orders.length,
        completedOrdersCount: completedOrders.length,
        totalSpent,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request, "users.update");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "validation_error", message: "userId обязателен" },
        { status: 400 }
      );
    }

    // Проверка: нельзя заблокировать самого себя
    if (userId === auth.userId) {
      return NextResponse.json(
        { error: "forbidden", message: "Нельзя заблокировать самого себя" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "not_found", message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Проверка: нельзя заблокировать последнего админа
    if (action === "block" && user.role.code === "admin") {
      const adminCount = await prisma.user.count({
        where: {
          role: { code: "admin" },
          isBlocked: false,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: "forbidden",
            message: "Нельзя заблокировать последнего администратора",
          },
          { status: 403 }
        );
      }
    }

    let updatedUser;

    if (action === "block") {
      if (!reason) {
        return NextResponse.json(
          { error: "validation_error", message: "Причина блокировки обязательна" },
          { status: 400 }
        );
      }

      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: true,
          blockedReason: reason,
          blockedAt: new Date(),
          blockedBy: auth.userId,
        },
        include: {
          role: true,
          blockedByUser: {
            select: { id: true, name: true },
          },
        },
      });

      // Логирование в аудит
      await prisma.activityLog.create({
        data: {
          userId: auth.userId,
          action: "user.blocked",
          entityType: "user",
          entityId: userId,
          details: {
            targetUser: user.name,
            reason,
          },
        },
      });
    } else if (action === "unblock") {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isBlocked: false,
          blockedReason: null,
          blockedAt: null,
          blockedBy: null,
        },
        include: {
          role: true,
          blockedByUser: {
            select: { id: true, name: true },
          },
        },
      });

      // Логирование в аудит
      await prisma.activityLog.create({
        data: {
          userId: auth.userId,
          action: "user.unblocked",
          entityType: "user",
          entityId: userId,
          details: {
            targetUser: user.name,
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: "validation_error", message: "Неверное действие. Используйте 'block' или 'unblock'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: action === "block" ? "Пользователь заблокирован" : "Пользователь разблокирован",
      user: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
