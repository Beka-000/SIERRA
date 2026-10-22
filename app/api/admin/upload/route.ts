/**
 * POST /api/admin/upload
 * Загружает изображение в Cloudinary.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint-utils";

// Явно Node.js runtime — cloudinary SDK несовместим с Edge runtime
export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

export async function POST(request: NextRequest) {
  // ── 1. Проверка прав ────────────────────────────────────────────────────────
  const auth = await requireAuth(request, "products.create");
  if (auth instanceof NextResponse) return auth;

  // ── 2. Проверяем переменные окружения ──────────────────────────────────────
  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey     = process.env.CLOUDINARY_API_KEY;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const missing = [
      !cloudName  && "CLOUDINARY_CLOUD_NAME",
      !apiKey     && "CLOUDINARY_API_KEY",
      !apiSecret  && "CLOUDINARY_API_SECRET",
    ].filter(Boolean).join(", ");

    console.error(`[Upload] Missing env vars: ${missing}`);
    return NextResponse.json(
      {
        error:   "storage_not_configured",
        message: `Хранилище не настроено. Отсутствуют переменные: ${missing}`,
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // ── 3. Валидация файла ────────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json(
        { error: "validation_error", message: "Файл не предоставлен" },
        { status: 400 }
      );
    }

    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: "validation_error", message: "Недопустимый тип. Разрешены: JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "validation_error", message: "Размер файла превышает 5 МБ" },
        { status: 400 }
      );
    }

    // ── 4. Конвертируем в base64 data URI ─────────────────────────────────────
    console.log(`[Upload] Converting file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    const arrayBuffer = await file.arrayBuffer();
    const base64  = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // ── 5. Динамически импортируем cloudinary и конфигурируем ─────────────────
    // Импорт внутри функции гарантирует что env vars уже доступны
    console.log("[Upload] Importing cloudinary SDK...");
    const { v2: cloudinary } = await import("cloudinary");

    cloudinary.config({
      cloud_name: cloudName,
      api_key:    apiKey,
      api_secret: apiSecret,
      secure:     true,
    });

    // ── 6. Загружаем в Cloudinary ─────────────────────────────────────────────
    console.log("[Upload] Uploading to Cloudinary...");
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder:        "sierra-coffee/products",
      resource_type: "image",
    });

    console.log(`[Upload] Success: ${uploadResult.secure_url}`);

    // ── 7. Сохраняем запись в БД ──────────────────────────────────────────────
    const fileRecord = await prisma.file.create({
      data: {
        url:        uploadResult.secure_url,
        storageKey: uploadResult.public_id,
        mimeType:   file.type,
        sizeBytes:  BigInt(file.size),
        uploadedBy: auth.userId,
      },
    });

    return NextResponse.json({
      id:        fileRecord.id,
      url:       fileRecord.url,
      fileName:  uploadResult.public_id,
      size:      file.size,
      sizeBytes: serializeBigInt(fileRecord.sizeBytes),
    });

  } catch (error: unknown) {
    // Логируем полный стек — будет виден в Vercel Function Logs
    console.error("[Upload] Error:", error instanceof Error ? error.stack : error);
    return handleApiError(error);
  }
}
