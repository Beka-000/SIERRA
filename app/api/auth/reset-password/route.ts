import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
// Body: { token: string; password: string }

export async function POST(request: NextRequest) {
  let token: string;
  let password: string;

  try {
    const body = await request.json();
    token    = (body.token    ?? "").trim();
    password = (body.password ?? "");
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Проверяем наличие токена
  if (!token || token.length !== 64) {
    return NextResponse.json(
      { error: "invalid_token", message: "Ссылка для восстановления недействительна." },
      { status: 400 }
    );
  }

  // Требования к паролю
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "weak_password", message: "Пароль должен содержать минимум 6 символов." },
      { status: 400 }
    );
  }

  if (password.length > 128) {
    return NextResponse.json(
      { error: "weak_password", message: "Пароль слишком длинный." },
      { status: 400 }
    );
  }

  // Ищем пользователя по токену
  const user = await prisma.user.findUnique({
    where: { resetToken: token },
    select: {
      id:               true,
      isBlocked:        true,
      resetToken:       true,
      resetTokenExpiry: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "invalid_token", message: "Ссылка для восстановления недействительна или уже использована." },
      { status: 400 }
    );
  }

  if (user.isBlocked) {
    return NextResponse.json(
      { error: "blocked", message: "Аккаунт заблокирован." },
      { status: 403 }
    );
  }

  // Проверяем срок действия токена
  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    // Очищаем просроченный токен
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });
    return NextResponse.json(
      { error: "token_expired", message: "Ссылка для восстановления истекла. Запросите новую." },
      { status: 400 }
    );
  }

  // Хешируем новый пароль
  const newHash = await hashPassword(password);

  // Обновляем пароль и сразу инвалидируем токен (одноразовое использование)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash:     newHash,
      resetToken:       null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Пароль успешно изменён.",
  });
}

// ─── GET /api/auth/reset-password?token=... ───────────────────────────────────
// Проверяем действительность токена перед показом формы

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!token || token.length !== 64) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { resetToken: token },
    select: { resetTokenExpiry: true, isBlocked: true },
  });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date() || user.isBlocked) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}
