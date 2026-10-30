/**
 * GET   /api/admin/reservations/[id]  — детали брони
 * PATCH /api/admin/reservations/[id]  — обновление статуса, столика, комментария
 *
 * Требует: reservations.view (GET), reservations.status_change (PATCH)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "ARRIVED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
type ReservationStatus = typeof VALID_STATUSES[number];

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "reservations.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const r = await prisma.reservation.findUnique({
      where: { id },
      include: {
        table: { select: { id: true, number: true, capacity: true, zone: true } },
        user:  { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!r) {
      return NextResponse.json({ error: "not_found", message: "Бронирование не найдено" }, { status: 404 });
    }

    return NextResponse.json({
      id:              r.id,
      customerName:    r.customerName,
      customerPhone:   r.customerPhone,
      branchId:        r.branchId,
      date:            r.date.toISOString().split("T")[0],
      startTime:       `${String(r.startTime.getUTCHours()).padStart(2, "0")}:${String(r.startTime.getUTCMinutes()).padStart(2, "0")}`,
      durationMinutes: r.durationMinutes,
      guestsCount:     r.guestsCount,
      comment:         r.comment,
      adminComment:    r.adminComment,
      changedBy:       r.changedBy,
      status:          r.status,
      createdAt:       r.createdAt.toISOString(),
      updatedAt:       r.updatedAt.toISOString(),
      table:           r.table,
      user:            r.user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "reservations.status_change");
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, tableId, adminComment } = body;

    // Проверяем существование
    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "not_found", message: "Бронирование не найдено" }, { status: 404 });
    }

    // Нельзя менять завершённые / отменённые (если не admin)
    const lockedStatuses: ReservationStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];
    if (lockedStatuses.includes(existing.status as ReservationStatus) && auth.role !== "admin") {
      return NextResponse.json(
        { error: "forbidden", message: "Нельзя изменить завершённое или отменённое бронирование" },
        { status: 403 }
      );
    }

    // Валидация нового статуса
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "validation_error", message: `Недопустимый статус: ${status}` },
        { status: 400 }
      );
    }

    // Если назначается столик — проверяем конфликт по времени
    if (tableId) {
      const resDate   = existing.date;
      const resStart  = existing.startTime;
      const resEnd    = new Date(resStart.getTime() + existing.durationMinutes * 60_000);

      const conflict = await prisma.reservation.findFirst({
        where: {
          id:      { not: id },
          tableId,
          status:  { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
          date:    resDate,
          startTime: {
            // пересечение: существующая бронь начинается до конца нашей
            lt: resEnd,
          },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "conflict", message: "На этот столик уже есть пересекающееся бронирование" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      changedBy: auth.userId,
    };

    if (status)                       updateData.status       = status;
    if (tableId !== undefined)        updateData.tableId      = tableId || null;
    if (adminComment !== undefined)   updateData.adminComment = adminComment?.trim() || null;

    const updated = await prisma.reservation.update({
      where: { id },
      data:  updateData,
      include: {
        table: { select: { id: true, number: true, capacity: true, zone: true } },
        user:  { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      id:              updated.id,
      customerName:    updated.customerName,
      customerPhone:   updated.customerPhone,
      branchId:        updated.branchId,
      date:            updated.date.toISOString().split("T")[0],
      startTime:       `${String(updated.startTime.getUTCHours()).padStart(2, "0")}:${String(updated.startTime.getUTCMinutes()).padStart(2, "0")}`,
      durationMinutes: updated.durationMinutes,
      guestsCount:     updated.guestsCount,
      comment:         updated.comment,
      adminComment:    updated.adminComment,
      status:          updated.status,
      changedBy:       updated.changedBy,
      createdAt:       updated.createdAt.toISOString(),
      updatedAt:       updated.updatedAt.toISOString(),
      table:           updated.table,
      user:            updated.user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
