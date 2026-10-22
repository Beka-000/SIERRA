import { type NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, isAdminRole } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS preflight — всегда пропускаем
  if (req.method === "OPTIONS") {
    return NextResponse.next();
  }

  // Публичные пути — пропускаем без проверки
  const isPublicAdminAuth =
    pathname === "/admin/login" || pathname === "/admin/otp";
  const isAdminPath = pathname.startsWith("/admin");
  const isUserDashboard = pathname.startsWith("/dashboard");
  const isApiAdminAuth = pathname.startsWith("/api/admin/auth");

  // API-роуты авторизации всегда открыты
  if (isApiAdminAuth) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  // ─── /admin/login и /admin/otp ────────────────────────────────────────────
  // Уже авторизованный admin → в дашборд
  if (isPublicAdminAuth) {
    if (session && isAdminRole(session.role)) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // ─── /admin/* ─────────────────────────────────────────────────────────────
  if (isAdminPath) {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (!isAdminRole(session.role)) {
      // Авторизованный обычный пользователь — не пускаем в админку
      // Показываем страницу 403 Forbidden
      return NextResponse.redirect(new URL("/403?from=admin", req.url));
    }
    return NextResponse.next();
  }

  // ─── /dashboard/* ─────────────────────────────────────────────────────────
  if (isUserDashboard) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isAdminRole(session.role)) {
      // Админ не должен попасть в пользовательский кабинет
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
