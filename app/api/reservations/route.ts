/**
 * POST /api/reservations
 * Публичный маршрут — создание заявки на бронирование.
 * Авторизация не требуется. Статус по умолчанию — PENDING.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicBranches } from "@/lib/branches";

// Максимальное количество гостей (совпадает с формой на сайте)
const MAX_GUESTS = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, date, time, guestsCount, branchId, comment } = body;

    // ── Валидация обязательных полей ─────────────────────────────────────────
    if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
      return NextResponse.json(
        { error: "validation_error", message: "Укажите имя" },
        { status: 400 }
      );
    }

    if (!customerPhone || typeof customerPhone !== "string") {
      return NextResponse.json(
        { error: "validation_error", message: "Укажите телефон" },
        { status: 400 }
      );
    }

    // Нормализуем телефон — оставляем только + и цифры
    const normalizedPhone = customerPhone.replace(/[^\d+]/g, "");
    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: "validation_error", message: "Некорректный формат телефона" },
        { status: 400 }
      );
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "validation_error", message: "Укажите дату" },
        { status: 400 }
      );
    }

    // Дата должна быть в будущем (от начала сегодняшнего дня)
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "validation_error", message: "Некорректная дата" },
        { status: 400 }
      );
    }
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsedDate < todayStart) {
      return NextResponse.json(
        { error: "validation_error", message: "Дата должна быть сегодня или в будущем" },
        { status: 400 }
      );
    }

    if (!time || typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "validation_error", message: "Укажите время в формате ЧЧ:ММ" },
        { status: 400 }
      );
    }

    const guests = parseInt(guestsCount, 10);
    if (isNaN(guests) || guests < 1 || guests > MAX_GUESTS) {
      return NextResponse.json(
        { error: "validation_error", message: `Количество гостей должно быть от 1 до ${MAX_GUESTS}` },
        { status: 400 }
      );
    }

    // ── Проверяем branchId — он должен быть из известного списка ────────────
    let validatedBranchId: string | null = null;
    if (branchId && typeof branchId === "string") {
      const knownBranches = getPublicBranches();
      const found = knownBranches.find((b) => b.id === branchId);
      if (found) validatedBranchId = branchId;
    }

    // ── Строим объекты дата+время для хранения ───────────────────────────────
    // date: сохраняем как полночь UTC этой даты
    const dateOnly = new Date(`${date}T00:00:00.000Z`);

    // startTime: хранится как DateTime с типом @db.Time — используем фиксированную дату
    const [hours, minutes] = time.split(":").map(Number);
    const startTime = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));

    // ── Сохраняем в БД ───────────────────────────────────────────────────────
    const reservation = await prisma.reservation.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: normalizedPhone,
        branchId: validatedBranchId,
        date: dateOnly,
        startTime,
        durationMinutes: 90,
        guestsCount: guests,
        comment: comment?.trim() || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        reservationId: reservation.id,
        message: "Заявка принята. Мы свяжемся с вами для подтверждения.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/reservations] Error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Ошибка при создании заявки" },
      { status: 500 }
    );
  }
}
