import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Получаем токен из cookies
    const token = request.cookies.get("sc_session")?.value;

    if (!token) {
      // Если пользователь не авторизован, ничего не делаем
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 200 });
    }

    const session = await verifySession(token);

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 200 });
    }

    // Проверяем, что пользователь существует и не заблокирован
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        isBlocked: true,
        lastSeenAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 200 });
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, message: "User is blocked" },
        { status: 403 }
      );
    }

    // Обновляем lastSeenAt только если прошло больше 30 секунд с последнего обновления
    // Это снижает нагрузку на БД
    const now = new Date();
    const shouldUpdate = !user.lastSeenAt || 
      (now.getTime() - new Date(user.lastSeenAt).getTime()) > 30000;

    if (shouldUpdate) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { lastSeenAt: now },
      });
    }

    return NextResponse.json({
      success: true,
      lastSeenAt: shouldUpdate ? now : user.lastSeenAt,
    });
  } catch (error) {
    console.error("[Heartbeat Error]", error);
    // Возвращаем 200, чтобы не прерывать работу фронтенда
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 200 }
    );
  }
}
