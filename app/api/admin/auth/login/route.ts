import { type NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { Client } from "pg";
import {
  generateOtpCode,
  signOtpToken,
  otpExpiresAt,
  OTP_COOKIE,
  isAdminRole,
  type UserRole,
} from "@/lib/auth";

function pgClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

// Отправка OTP через бота — токен читаем из таблицы settings
async function sendOtpViaTelegram(
  client: Client,
  chatId: string,
  code: string
): Promise<void> {
  const tokenRes = await client.query(
    `SELECT value FROM settings WHERE key = 'ADMIN_TELEGRAM_BOT_TOKEN' LIMIT 1`
  );
  const token = tokenRes.rows[0]?.value;

  if (!token) throw new Error("ADMIN_TELEGRAM_BOT_TOKEN не найден в settings");

  const text = [
    `🔐 <b>Sierra Coffee — код подтверждения</b>`,
    ``,
    `Ваш код: <b>${code}</b>`,
    ``,
    `Действителен 5 минут. Никому не сообщайте этот код.`,
  ].join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram API: ${err}`);
  }
}

// ─── POST /api/admin/auth/login ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const { email, password } = body;

  if (!email?.trim() || !password) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const client = pgClient();
  await client.connect();

  try {
    // Загружаем пользователя с ролью через JOIN
    const userRes = await client.query(
      `SELECT u.id, u.email, u.password_hash, u.name, u.is_blocked,
              r.code AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const user = userRes.rows[0];

    // Timing-safe: всегда вызываем compare
    const candidateHash =
      user?.password_hash ?? "$2b$12$placeholder.hash.to.prevent.timing";
    const passwordValid = await compare(password, candidateHash);

    if (!user || !passwordValid) {
      return Response.json({ error: "invalid_credentials" }, { status: 401 });
    }

    if (user.is_blocked) {
      return Response.json({ error: "account_blocked" }, { status: 403 });
    }

    if (!isAdminRole(user.role as UserRole)) {
      return Response.json({ error: "no_access" }, { status: 403 });
    }

    // Telegram chat_id из settings
    const chatRes = await client.query(
      `SELECT value FROM settings WHERE key = 'ADMIN_TELEGRAM_USER_ID' LIMIT 1`
    );
    const chatId = chatRes.rows[0]?.value;

    if (!chatId) {
      console.error("[Admin Login] ADMIN_TELEGRAM_USER_ID не задан в settings");
      return Response.json({ error: "telegram_not_configured" }, { status: 500 });
    }

    // Генерируем и отправляем OTP
    const code = generateOtpCode();

    try {
      await sendOtpViaTelegram(client, chatId, code);
    } catch (err) {
      console.error("[Admin Login] Ошибка отправки OTP:", err);
      return Response.json({ error: "telegram_send_failed" }, { status: 500 });
    }

    // Подписываем OTP-токен
    const otpToken = await signOtpToken({
      userId: user.id,
      code,
      expiresAt: otpExpiresAt(),
    });

    const cookieHeader = [
      `${OTP_COOKIE}=${otpToken}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=300",
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Set-Cookie", cookieHeader);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } finally {
    await client.end();
  }
}
