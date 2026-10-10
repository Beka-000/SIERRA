import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  setSessionCookie,
  hashPassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, password, confirmPassword } = body;

    // Validation
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "validation_error", message: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "password_mismatch", message: "Пароли не совпадают" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "weak_password", message: "Пароль должен быть минимум 6 символов" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.phone === phone) {
        return NextResponse.json(
          { error: "phone_exists", message: "Телефон уже зарегистрирован" },
          { status: 409 }
        );
      }
      if (email && existing.email === email) {
        return NextResponse.json(
          { error: "email_exists", message: "Email уже зарегистрирован" },
          { status: 409 }
        );
      }
    }

    // Get client role
    let clientRole = await prisma.role.findFirst({
      where: { code: "client" },
    });

    if (!clientRole) {
      // Create default client role if doesn't exist
      clientRole = await prisma.role.create({
        data: {
          code: "client",
          title: "Клиент",
          permissions: {},
        },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        roleId: clientRole.id,
        name,
        phone,
        email: email || null,
        passwordHash,
      },
      include: {
        role: true,
      },
    });

    // Create session
    const token = await createSession({
      userId: user.id,
      role: user.role.code,
      name: user.name,
      email: user.email,
    });

    await setSessionCookie(token);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role.code,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register Error]", error);
    return NextResponse.json(
      { error: "server_error", message: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
