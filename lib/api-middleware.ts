import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./auth";
import { hasPermission, type Permission } from "./permissions";

/**
 * Middleware для проверки аутентификации и прав доступа
 */
export async function requireAuth(
  request: NextRequest,
  requiredPermission?: Permission
): Promise<{ userId: string; role: string; email: string } | NextResponse> {
  try {
    // Получаем токен из cookies запроса
    const token = request.cookies.get("sc_session")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "unauthorized", message: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session) {
      return NextResponse.json(
        { error: "unauthorized", message: "Требуется авторизация" },
        { status: 401 }
      );
    }

    // Проверяем права доступа, если указаны
    if (requiredPermission) {
      const role = session.role as "admin" | "manager" | "staff" | "client";
      
      if (!hasPermission(role, requiredPermission)) {
        return NextResponse.json(
          { error: "forbidden", message: "Недостаточно прав доступа" },
          { status: 403 }
        );
      }
    }

    return {
      userId: session.userId,
      role: session.role,
      email: session.email || "",
    };
  } catch (error) {
    console.error("[Auth Middleware Error]", error);
    return NextResponse.json(
      { error: "server_error", message: "Ошибка проверки аутентификации" },
      { status: 500 }
    );
  }
}

/**
 * Middleware специально для админ-панели
 * Проверяет, что пользователь имеет админскую роль (admin, manager, или staff)
 */
export async function requireAdminAuth(
  request: NextRequest,
  requiredPermission?: Permission
): Promise<{ userId: string; role: string; email: string } | NextResponse> {
  const authResult = await requireAuth(request, requiredPermission);

  // Если уже вернули ошибку - пробросим её
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Проверяем админскую роль
  const adminRoles = ["admin", "manager", "staff"];
  if (!adminRoles.includes(authResult.role)) {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "Доступ к административной панели запрещён. Требуется роль администратора.",
      },
      { status: 403 }
    );
  }

  return authResult;
}

/**
 * Обработчик ошибок API
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("[API Error]", error);

  if (error instanceof Error) {
    return NextResponse.json(
      { error: "server_error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "server_error", message: "Внутренняя ошибка сервера" },
    { status: 500 }
  );
}

/**
 * Валидация тела запроса
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: Record<keyof T, "string" | "number" | "boolean" | "array" | "object">
): Promise<T | NextResponse> {
  try {
    const body = await request.json();

    for (const [key, type] of Object.entries(schema)) {
      const value = body[key];

      if (value === undefined || value === null) {
        return NextResponse.json(
          { error: "validation_error", message: `Поле ${key} обязательно` },
          { status: 400 }
        );
      }

      if (type === "array" && !Array.isArray(value)) {
        return NextResponse.json(
          { error: "validation_error", message: `Поле ${key} должно быть массивом` },
          { status: 400 }
        );
      }

      if (type !== "array" && typeof value !== type) {
        return NextResponse.json(
          { error: "validation_error", message: `Поле ${key} должно быть типа ${type}` },
          { status: 400 }
        );
      }
    }

    return body as T;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Невалидный JSON" },
      { status: 400 }
    );
  }
}
