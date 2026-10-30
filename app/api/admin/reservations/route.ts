/**
 * GET  /api/admin/reservations — список бронирований
 * POST /api/admin/reservations — создание брони сотрудником вручную
 *
 * Требует роли: admin, manager, staff (rights: reservations.view)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "reservations.view");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = request.nextUrl;

    const page   = Math.max(1, parseInt(searchParams.get("page")  || "1",  10));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") || "30", 10));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const date   = searchParams.get("date")   || "";
    const branchId = searchParams.get("branchId") || "";

    // ── Фильтры ──────────────────────────────────────────────────────────────
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (date) {
      // фильтр по конкретной дате (YYYY-MM-DD)
      const d = new Date(`${date}T00:00:00.000Z`);
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 1);
      where.date = { gte: d, lt: next };
    }

    if (search) {
      where.OR = [
        { customerName:  { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, reservations] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          table: { select: { id: true, number: true, capacity: true, zone: true } },
          user:  { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const items = reservations.map((r) => ({
      id:             r.id,
      customerName:   r.customerName,
      customerPhone:  r.customerPhone,
      branchId:       r.branchId,
      date:           r.date.toISOString().split("T")[0],
      startTime:      `${String(r.startTime.getUTCHours()).padStart(2, "0")}:${String(r.startTime.getUTCMinutes()).padStart(2, "0")}`,
      durationMinutes: r.durationMinutes,
      guestsCount:    r.guestsCount,
      comment:        r.comment,
      adminComment:   r.adminComment,
      changedBy:      r.changedBy,
      status:         r.status,
      createdAt:      r.createdAt.toISOString(),
      updatedAt:      r.updatedAt.toISOString(),
      table:          r.table,
      user:           r.user,
    }));

    return NextResponse.json({
      reservations: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
