import { SESSION_COOKIE, OTP_COOKIE } from "@/lib/auth";

// ─── POST /api/admin/auth/logout ──────────────────────────────────────────────

export async function POST() {
  const clearSession = [
    `${SESSION_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");

  const clearOtp = [
    `${OTP_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Set-Cookie", clearSession);
  headers.append("Set-Cookie", clearOtp);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}
