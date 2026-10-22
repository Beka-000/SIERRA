/**
 * POST /api/auth/register
 *
 * Требует наличия httpOnly cookie sc_phone_verified (JWT выданный /api/auth/otp/verify).
 * Проверяет, что phone в теле запроса совпадает с phone в верифицированном токене.
 * Только после этого создаёт пользователя с phoneVerified = true.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify }                 from "jose";
import { prisma }                    from "@/lib/prisma";
import { createSession, setSessionCookie, hashPassword } from "@/lib/auth";
import { PHONE_VERIFIED_COOKIE }     from "@/app/api/auth/otp/verify/route";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sierra-coffee-secret-key-change-in-production"
);

// ─── Rate-limit регистрации (in-memory) ───────────────────────────────────────
// 5 регистраций с одного IP за 60 минут

const registerRl = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW  = 60 * 60 * 1000;
const RL_MAX     = 5;

function isRegisterLimited(ip: string): boolean {
  const now = Date.now();
  const rec = registerRl.get(ip);
  if (!rec || now > rec.resetAt) {
    registerRl.set(ip, { count: 1, resetAt: now + RL_WINDOW });
    return false;
  }
  if (rec.count >= RL_MAX) return true;
  rec.count++;
  return false;
}

// ─── Обработчик ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRegisterLimited(ip)) {
    return NextResponse.json(
      { error: "too_many_requests", message: "Слишком много попыток. Попробуйте позже." },
      { status: 429 }
    );
  }

  // ── 1. Проверяем sc_phone_verified cookie ──────────────────────────────────
  const verifiedCookie = request.cookies.get(PHONE_VERIFIED_COOKIE)?.value;

  if (!verifiedCookie) {
    return NextResponse.json(
      { error: "phone_not_verified", message: "Подтвердите номер телефона через SMS." },
      { status: 403 }
    );
  }

  let verifiedPhone: string;
  try {
    const { payload } = await jwtVerify(verifiedCookie, JWT_SECRET);
    if (
      typeof payload.phone    !== "string" ||
      payload.verified        !== true
    ) {
      throw new Error("bad payload");
    }
    verifiedPhone = payload.phone;
  } catch {
    return NextResponse.json(
      { error: "phone_not_verified", message: "Срок подтверждения номера истёк. Начните заново." },
      { status: 403 }
    );
  }

  // ── 2. Разбираем тело запроса ──────────────────────────────────────────────
  let body: {
    name?: string; phone?: string; email?: string;
    password?: string; confirmPassword?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { name, phone, email, password, confirmPassword } = body;

  if (!name || !phone || !password) {
    return NextResponse.json(
      { error: "validation_error", message: "Заполните все обязательные поля" },
      { status: 400 }
    );
  }

  // ── 3. Телефон в теле ДОЛЖЕН совпадать с верифицированным ────────────────
  if (phone !== verifiedPhone) {
    return NextResponse.json(
      { error: "phone_mismatch", message: "Номер телефона не совпадает с подтверждённым." },
      { status: 403 }
    );
  }

  // ── 4. Валидация пароля ────────────────────────────────────────────────────
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

  // ── 5. Проверяем уникальность ─────────────────────────────────────────────
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

  // ── 6. Роль клиента ────────────────────────────────────────────────────────
  let clientRole = await prisma.role.findFirst({ where: { code: "client" } });
  if (!clientRole) {
    clientRole = await prisma.role.create({
      data: { code: "client", title: "Клиент", permissions: {} },
    });
  }

  // ── 7. Создаём пользователя с phoneVerified = true ────────────────────────
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      roleId:        clientRole.id,
      name,
      phone,
      email:         email || null,
      passwordHash,
      phoneVerified: true,  // ← подтверждён через SMS OTP
    },
    include: { role: true },
  });

  // ── 8. Инвалидируем sc_phone_verified и создаём сессию ───────────────────
  const sessionToken = await createSession({
    userId: user.id,
    role:   user.role.code,
    name:   user.name,
    email:  user.email,
  });

  await setSessionCookie(sessionToken);

  const response = NextResponse.json(
    {
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role.code,
      },
    },
    { status: 201 }
  );

  // Удаляем verified cookie — она одноразовая
  response.cookies.set(PHONE_VERIFIED_COOKIE, "", { maxAge: 0, path: "/" });

  return response;
}
