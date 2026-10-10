import { type NextRequest } from "next/server";
import { Client } from "pg";
import {
  verifyOtpToken,
  signSession,
  SESSION_COOKIE,
  OTP_COOKIE,
  type UserRole,
} from "@/lib/auth";

function pgClient() {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

// ─── POST /api/admin/auth/verify ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { code?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const { code } = body;

  if (!code || !/^\d{6}$/.test(code)) {
    return Response.json({ error: "invalid_code" }, { status: 400 });
  }

  const otpToken = request.cookies.get(OTP_COOKIE)?.value;
  if (!otpToken) {
    return Response.json({ error: "otp_expired" }, { status: 401 });
  }

  const otpPayload = await verifyOtpToken(otpToken);
  if (!otpPayload) {
    return Response.json({ error: "otp_expired" }, { status: 401 });
  }

  if (otpPayload.code !== code || (otpPayload.expiresAt && Date.now() / 1000 > otpPayload.expiresAt)) {
    return Response.json({ error: "invalid_code" }, { status: 401 });
  }

  // Проверяем пользователя актуальными данными
  const client = pgClient();
  await client.connect();

  try {
    const userRes = await client.query(
      `SELECT u.id, u.email, u.name, u.is_blocked, r.code AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1
       LIMIT 1`,
      [otpPayload.userId]
    );

    const user = userRes.rows[0];

    if (!user || user.is_blocked) {
      return Response.json({ error: "account_blocked" }, { status: 403 });
    }

    const sessionToken = await signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    const sessionCookie = [
      `${SESSION_COOKIE}=${sessionToken}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=28800",
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    const clearOtpCookie = [
      `${OTP_COOKIE}=`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=0",
    ].join("; ");

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Set-Cookie", sessionCookie);
    headers.append("Set-Cookie", clearOtpCookie);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } finally {
    await client.end();
  }
}
