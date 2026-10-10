import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Получаем токен из cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("sc_session")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    const session = await verifySession(token);

    if (!session) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    // Проверяем, что это не клиент
    if (session.role === "client") {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      userId: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    });
  } catch (error) {
    console.error("[Session Check Error]", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
