/**
 * POST /api/auth/otp/verify
 *
 * Принимает: { code: string }  — 6 цифр
 *
 * Что делает:
 *  1. Читает httpOnly cookie sc_phone_otp → JWT с { phone, code }.
 *  2. Верифицирует JWT (подпись + срок действия).
 *  3. Сравнивает code из тела с code из JWT.
 *  4. Rate-limit: не более 5 неверных попыток по одному cookie.
 *  5. При успехе — удаляет sc_phone_otp и выставляет sc_phone_verified
 *     (JWT: { phone, verified: true }, exp 15 мин).
 *
 * sc_phone_verified нужен /api/auth/register чтобы убедиться,
 * что телефон подтверждён в этой сессии браузера.
 */

import { NextRequest, NextResponse }     from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { PHONE_OTP_COOKIE }              from "../send/route";

// ─── Константы ────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sierra-coffee-secret-key-change-in-production"
);
export const PHONE_VERIFIED_COOKIE = "sc_phone_verified";
const VERIFIED_TTL = 15 * 60; // 15 минут — время на заполнение остальных полей

// ─── Rate-limit попыток ввода кода ────────────────────────────────────────────
// Ключ = первые 16 символов токена (вместо IP — защита конкретного OTP)

const attempts = new Map<string, number>();
const MAX_ATTEMPTS = 5;

// ─── Обработчик ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let inputCode: string;
  try {
    const body = await request.json();
    inputCode = (body.code ?? "").replace(/\D/g, ""); // только цифры
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(inputCode)) {
    return NextResponse.json(
      { error: "invalid_code", message: "Введите 6-значный код." },
      { status: 400 }
    );
  }

  // Читаем OTP-cookie
  const otpToken = request.cookies.get(PHONE_OTP_COOKIE)?.value;
  if (!otpToken) {
    return NextResponse.json(
      { error: "otp_expired", message: "Код истёк или не был отправлен. Запросите новый." },
      { status: 401 }
    );
  }

  // Rate-limit по ключу токена
  const tokenKey = otpToken.slice(0, 16);
  const count = (attempts.get(tokenKey) ?? 0) + 1;
  if (count > MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "too_many_attempts", message: "Слишком много неверных попыток. Запросите новый код." },
      { status: 429 }
    );
  }
  attempts.set(tokenKey, count);

  // Верифицируем JWT
  let payload: { phone: string; code: string };
  try {
    const { payload: p } = await jwtVerify(otpToken, JWT_SECRET);
    if (typeof p.phone !== "string" || typeof p.code !== "string") {
      throw new Error("bad payload");
    }
    payload = { phone: p.phone, code: p.code };
  } catch (err: any) {
    const isExpired = err?.code === "ERR_JWT_EXPIRED";
    return NextResponse.json(
      {
        error: isExpired ? "otp_expired" : "otp_expired",
        message: "Код истёк или недействителен. Запросите новый.",
      },
      { status: 401 }
    );
  }

  // Сравниваем коды
  if (payload.code !== inputCode) {
    const remaining = MAX_ATTEMPTS - count;
    return NextResponse.json(
      {
        error:     "wrong_code",
        message:   remaining > 0
          ? `Неверный код. Осталось попыток: ${remaining}.`
          : "Неверный код. Запросите новый.",
        remaining,
      },
      { status: 401 }
    );
  }

  // Код верный — очищаем счётчик
  attempts.delete(tokenKey);

  // Выпускаем sc_phone_verified
  const verifiedToken = await new SignJWT({ phone: payload.phone, verified: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${VERIFIED_TTL}s`)
    .sign(JWT_SECRET);

  const response = NextResponse.json({ success: true, phone: payload.phone });

  // Удаляем OTP cookie
  response.cookies.set(PHONE_OTP_COOKIE, "", {
    httpOnly: true,
    maxAge:   0,
    path:     "/",
  });

  // Выставляем Verified cookie
  response.cookies.set(PHONE_VERIFIED_COOKIE, verifiedToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   VERIFIED_TTL,
    path:     "/",
  });

  return response;
}
