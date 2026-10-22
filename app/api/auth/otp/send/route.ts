/**
 * POST /api/auth/otp/send
 *
 * Принимает: { phone: string }  — номер в формате +996XXXXXXXXX
 *
 * Что делает:
 *  1. Валидирует формат номера.
 *  2. Проверяет, не зарегистрирован ли уже этот номер.
 *  3. Rate-limit: не более 3 SMS с одного номера или IP за 10 минут.
 *  4. Генерирует 6-значный OTP.
 *  5. Подписывает его в JWT (phone + code + exp 5 мин) → кладёт в httpOnly cookie sc_phone_otp.
 *  6. Отправляет SMS через Twilio.
 *
 * Ответ: { success: true }  — всегда одинаковый (не раскрываем, существует ли номер).
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT }                   from "jose";
import { prisma }                    from "@/lib/prisma";
import { sendSmsOtp }                from "@/lib/sms";
import { generateOtpCode }           from "@/lib/auth";

// ─── Константы ────────────────────────────────────────────────────────────────

const JWT_SECRET       = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sierra-coffee-secret-key-change-in-production"
);
export const PHONE_OTP_COOKIE = "sc_phone_otp";
const OTP_TTL_SECONDS  = 5 * 60;   // 5 минут

// ─── Rate limiting (in-memory) ────────────────────────────────────────────────
// Ключ: phone OR ip → { count, resetAt }

const rl = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW = 10 * 60 * 1000; // 10 минут
const RL_MAX    = 3;               // 3 попытки

function isLimited(key: string): boolean {
  const now = Date.now();
  const rec = rl.get(key);
  if (!rec || now > rec.resetAt) {
    rl.set(key, { count: 1, resetAt: now + RL_WINDOW });
    return false;
  }
  if (rec.count >= RL_MAX) return true;
  rec.count++;
  return false;
}

// ─── Валидация номера ─────────────────────────────────────────────────────────

const KG_PHONE_RE = /^\+996\d{9}$/;

// ─── Обработчик ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  let phone: string;
  try {
    const body = await request.json();
    phone = (body.phone ?? "").trim();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // 1. Формат номера
  if (!KG_PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "invalid_phone", message: "Введите корректный номер (+996 XXX XXX XXX)." },
      { status: 400 }
    );
  }

  // 2. Rate limit по номеру и IP
  if (isLimited(phone) || isLimited(ip)) {
    return NextResponse.json(
      { error: "too_many_requests", message: "Слишком много попыток. Попробуйте через 10 минут." },
      { status: 429 }
    );
  }

  // 3. Проверяем, не занят ли уже номер
  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });
  if (existing) {
    // Отвечаем 200 с признаком phone_exists чтобы UI мог показать правильное сообщение,
    // но не раскрываем ничего лишнего
    return NextResponse.json(
      { error: "phone_exists", message: "Этот номер уже зарегистрирован." },
      { status: 409 }
    );
  }

  // 4. Генерируем код
  const code = generateOtpCode(); // 6 цифр

  // 5. Подписываем JWT с phone + code
  const token = await new SignJWT({ phone, code })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OTP_TTL_SECONDS}s`)
    .sign(JWT_SECRET);

  // 6. Отправляем SMS (не ждём — ошибка отправки логируется, не блокирует ответ)
  sendSmsOtp(phone, code).catch((err) =>
    console.error("[otp/send] SMS failed:", err?.message ?? err)
  );

  // 7. Устанавливаем httpOnly cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set(PHONE_OTP_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   OTP_TTL_SECONDS,
    path:     "/",
  });

  return response;
}
