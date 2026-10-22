/**
 * POST /api/admin/upload
 *
 * Загружает изображение в Vercel Blob Storage (serverless-совместимо).
 * Файловая система НЕ используется — это позволяет работать на Vercel.
 *
 * Переменная окружения: BLOB_READ_WRITE_TOKEN (автоматически добавляется
 * при подключении Vercel Blob в Dashboard → Storage → Blob).
 */

import { NextRequest, NextResponse } from "next/server";
import { put }                       from "@vercel/blob";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma }                    from "@/lib/prisma";
import { serializeBigInt }           from "@/lib/bigint-utils";

const MAX_FILE_SIZE   = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES   = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
type AllowedType = typeof ALLOWED_TYPES[number];

export async function POST(request: NextRequest) {
  // ── 1. Проверка прав ────────────────────────────────────────────────────────
  const auth = await requireAuth(request, "products.create");
  if (auth instanceof NextResponse) return auth;

  // ── 2. Проверяем наличие BLOB_READ_WRITE_TOKEN ──────────────────────────────
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[Upload] BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json(
      {
        error:   "storage_not_configured",
        message: "Хранилище изображений не настроено. Добавьте BLOB_READ_WRITE_TOKEN в переменные окружения.",
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
        {
          error:   "validation_error",
          message: "Недопустимый тип файла. Разрешены: JPG, PNG, WebP",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:   "validation_error",
          message: "Размер файла превышает 5 МБ",
        },
        { status: 400 }
      );
    }

    // ── 4. Генерируем имя файла ───────────────────────────────────────────────
    const timestamp    = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const extension    = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const blobPath     = `products/${timestamp}-${randomSuffix}.${extension}`;

    // ── 5. Загружаем в Vercel Blob ────────────────────────────────────────────
    const blob = await put(blobPath, file, {
      access:      "public",   // публичный URL — нужен для показа на сайте
      contentType: file.type as AllowedType,
    });

    // ── 6. Сохраняем запись в БД ──────────────────────────────────────────────
    const fileRecord = await prisma.file.create({
      data: {
        url:        blob.url,           // постоянный CDN-URL от Vercel Blob
        storageKey: blob.pathname,      // путь внутри Blob-хранилища
        mimeType:   file.type,
        sizeBytes:  BigInt(file.size),
        uploadedBy: auth.userId,
      },
    });

    return NextResponse.json({
      id:        fileRecord.id,
      url:       fileRecord.url,
      fileName:  blobPath,
      size:      file.size,
      sizeBytes: serializeBigInt(fileRecord.sizeBytes),
    });

  } catch (error: unknown) {
    console.error("[Upload Error]", error);

    // Vercel Blob возвращает специфичные ошибки — показываем понятное сообщение
    if (error instanceof Error && error.message.includes("BLOB_READ_WRITE_TOKEN")) {
      return NextResponse.json(
        {
          error:   "storage_auth_error",
          message: "Ошибка авторизации в хранилище. Проверьте BLOB_READ_WRITE_TOKEN.",
        },
        { status: 500 }
      );
    }

    return handleApiError(error);
  }
}
