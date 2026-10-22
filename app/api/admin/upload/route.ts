/**
 * POST /api/admin/upload
 *
 * Загружает изображение в Cloudinary (CDN + хранилище).
 * Serverless-совместимо — файловая система не используется.
 *
 * Переменные окружения (.env):
 *   - CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (для CDN-URL на клиенте)
 */

import { NextRequest, NextResponse }    from "next/server";
import { requireAuth, handleApiError }   from "@/lib/api-middleware";
import { prisma }                        from "@/lib/prisma";
import { serializeBigInt }               from "@/lib/bigint-utils";
import {
  cloudinary,
  isCloudinaryConfigured,
  DEFAULT_UPLOAD_FOLDER,
  type UploadApiResponse,
}                                       from "@/lib/cloudinary";

// Явно указываем Node.js runtime — cloudinary SDK использует Node.js Streams
export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

export async function POST(request: NextRequest) {
  // ── 1. Проверка прав ────────────────────────────────────────────────────────
  const auth = await requireAuth(request, "products.create");
  if (auth instanceof NextResponse) return auth;

  // ── 2. Проверяем, что Cloudinary настроен ──────────────────────────────────
  if (!isCloudinaryConfigured()) {
    console.error("[Upload] Cloudinary env vars are not set");
    return NextResponse.json(
      {
        error:   "storage_not_configured",
        message: "Хранилище изображений не настроено. Добавьте CLOUDINARY_* переменные в окружение.",
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

    // ── 4. Читаем файл и конвертируем в base64 data URI ──────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const base64      = Buffer.from(arrayBuffer).toString("base64");
    const dataUri     = `data:${file.type};base64,${base64}`;

    // ── 5. Загружаем в Cloudinary ─────────────────────────────────────────────
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder:        DEFAULT_UPLOAD_FOLDER,
      resource_type: "image",
    }) as UploadApiResponse;

    // ── 6. Сохраняем запись в БД ──────────────────────────────────────────────
    const fileRecord = await prisma.file.create({
      data: {
        url:        uploadResult.secure_url,  // постоянный CDN-URL от Cloudinary
        storageKey: uploadResult.public_id,    // public_id нужен для удаления
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
    console.error("[Upload Error]", error);
    return handleApiError(error);
  }
}
