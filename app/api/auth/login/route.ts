import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "validation_error", message: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: email }],
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Check if blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { error: "blocked", message: "Аккаунт заблокирован" },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash || "");
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession({
      userId: user.id,
      role: user.role.code,
      name: user.name,
      email: user.email,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.code,
      },
    });
  } catch (error) {
    console.error("[Login Error]", error);
    return NextResponse.json(
      { error: "server_error", message: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
