import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";

// ─── Rate limiting (in-memory, per-IP) ───────────────────────────────────────
// Разрешаем не более 3 запросов с одного IP за 15 минут

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 минут
const RATE_MAX       = 3;

function isRateLimited(ip: string): boolean {
  const now    = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_MAX) return true;
  record.count++;
  return false;
}

// ─── Токен — 32 случайных байта в hex (64 символа) ───────────────────────────

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ─── Обработчик ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "too_many_requests", message: "Слишком много запросов. Попробуйте через 15 минут." },
      { status: 429 }
    );
  }

  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Базовая проверка формата email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Введите корректный Email." },
      { status: 400 }
    );
  }

  // Ищем пользователя. Независимо от результата возвращаем один и тот же
  // ответ — чтобы не раскрывать, зарегистрирован ли email.
  const SAFE_RESPONSE = NextResponse.json({
    success: true,
    message: "Если аккаунт с таким Email существует, мы отправили инструкцию по восстановлению пароля.",
  });

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    // Пользователь не найден или вход только через Google — не раскрываем
    return SAFE_RESPONSE;
  }

  if (user.isBlocked) {
    return SAFE_RESPONSE;
  }

  // Генерируем токен
  const rawToken = generateResetToken();

  // Сохраняем токен в БД. Срок действия — 1 час.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken:       rawToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // Формируем ссылку
  const appUrl    = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

  // Отправляем письмо (не ждём — ошибка отправки не блокирует ответ,
  // но логируем её)
  sendPasswordResetEmail(user.email!, resetLink).catch((err) => {
    console.error("[forgot-password] Email send failed:", err?.message ?? err);
  });

  return SAFE_RESPONSE;
}
