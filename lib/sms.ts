/**
 * lib/sms.ts — Twilio SMS sender
 *
 * Требуемые переменные окружения:
 *   TWILIO_ACCOUNT_SID   — Account SID из Twilio Console
 *   TWILIO_AUTH_TOKEN    — Auth Token из Twilio Console
 *   TWILIO_PHONE_NUMBER  — Номер Twilio в формате +1XXXXXXXXXX
 *
 * Получить бесплатный триал: https://www.twilio.com/try-twilio
 * Кыргызстан (+996) поддерживается через международную маршрутизацию.
 */

import twilio from "twilio";

function getClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("SMS not configured: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required");
  }

  return twilio(sid, token);
}

/**
 * Отправить OTP-код на номер телефона.
 * @param to   — номер в международном формате, напр. +996555123456
 * @param code — 6-значный код
 */
export async function sendSmsOtp(to: string, code: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error("SMS not configured: TWILIO_PHONE_NUMBER is required");
  }

  const client = getClient();

  await client.messages.create({
    to,
    from,
    body: `Sierra Coffee: ваш код подтверждения — ${code}. Действителен 5 минут.`,
  });
}
