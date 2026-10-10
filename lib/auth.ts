import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sierra-coffee-secret-key-change-in-production"
);

const SESSION_COOKIE_NAME = "sc_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionData {
  userId: string;
  role: string;
  name: string;
  email: string | null;
}

export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Type assertion with validation
    if (
      typeof payload.userId === "string" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string"
    ) {
      return {
        userId: payload.userId,
        role: payload.role,
        name: payload.name,
        email: payload.email as string | null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession(): Promise<SessionData | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  return verifySession(token);
}

export async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - in production use bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "sierra_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ====================================
// ADMIN AUTH (OTP & SESSION)
// ====================================

export type UserRole = "admin" | "manager" | "staff" | "client";

export interface SessionPayload {
  userId: string;
  role: UserRole;
  name: string;
  email: string | null;
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
export const OTP_COOKIE = "sc_otp";

export function isAdminRole(role: string): boolean {
  return ["admin", "manager", "staff"].includes(role);
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionData | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const token = match[1];
  return verifySession(token);
}

// OTP для админки
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signOtpToken(data: {
  userId: string;
  code: string;
  expiresAt?: Date;
}): Promise<string> {
  return new SignJWT({ userId: data.userId, code: data.code })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(JWT_SECRET);
}

export async function verifyOtpToken(token: string): Promise<{
  userId: string;
  code: string;
  expiresAt?: number;
} | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.userId === "string" && typeof payload.code === "string") {
      return {
        userId: payload.userId,
        code: payload.code,
        expiresAt: payload.exp,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function signSession(data: SessionPayload): Promise<string> {
  return createSession(data);
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
}

