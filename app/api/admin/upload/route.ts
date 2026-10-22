/**
 * POST /api/admin/upload
 * Загружает изображение в Cloudinary.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/bigint-utils";

// Явно Node.js runtime — cloudinary SDK несовместим с Edge runtime
export const runtime = "nodejs";

// Leave room for multipart headers under Vercel Functions' 4.5 MB request limit.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

let cloudinarySdkImport: Promise<typeof import("cloudinary")> | undefined;

function loadCloudinarySdk(ignoreInvalidUrl: boolean) {
  if (!cloudinarySdkImport) {
    if (!ignoreInvalidUrl) {
      cloudinarySdkImport = import("cloudinary");
    } else {
      // The SDK parses CLOUDINARY_URL while importing, before config() can
      // apply the separate credentials. Ignore a malformed, redundant URL
      // during that one-time import; the caller configures the SDK explicitly.
      const originalUrl = process.env.CLOUDINARY_URL;
      delete process.env.CLOUDINARY_URL;
      cloudinarySdkImport = import("cloudinary").finally(() => {
        if (originalUrl === undefined) {
          delete process.env.CLOUDINARY_URL;
        } else {
          process.env.CLOUDINARY_URL = originalUrl;
        }
      });
    }
  }

  return cloudinarySdkImport;
}

export async function POST(request: NextRequest) {
  // ── 1. Проверка прав ────────────────────────────────────────────────────────
  const auth = await requireAuth(request, "products.create");
  if (auth instanceof NextResponse) return auth;

  // ── 2. Проверяем переменные окружения ──────────────────────────────────────
  let stage = "configuration";
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const hasExplicitCredentials = Boolean(cloudName && apiKey && apiSecret);
    const hasValidCloudinaryUrl = Boolean(cloudinaryUrl?.toLowerCase().startsWith("cloudinary://"));

    if (!hasExplicitCredentials && !hasValidCloudinaryUrl) {
      const missing = [
        !cloudName && !hasValidCloudinaryUrl && "CLOUDINARY_CLOUD_NAME (or valid CLOUDINARY_URL)",
        !apiKey && !hasValidCloudinaryUrl && "CLOUDINARY_API_KEY (or valid CLOUDINARY_URL)",
        !apiSecret && !hasValidCloudinaryUrl && "CLOUDINARY_API_SECRET (or valid CLOUDINARY_URL)",
      ].filter(Boolean).join(", ");

      console.error(`[Upload] Cloudinary is not configured; missing: ${missing}`);
      return NextResponse.json(
        {
          error: "storage_not_configured",
          message: "Хранилище изображений не настроено на сервере. Проверьте переменные Cloudinary в Vercel.",
        },
        { status: 503 }
      );
    }

    stage = "request parsing";
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
        { error: "validation_error", message: "Размер файла превышает 4 МБ" },
        { status: 400 }
      );
    }

    // ── 4. Конвертируем в base64 data URI ─────────────────────────────────────
    stage = "file conversion";
    console.log(`[Upload] Converting file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    const arrayBuffer = await file.arrayBuffer();
    const base64  = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // ── 5. Динамически импортируем cloudinary и конфигурируем ─────────────────
    // The SDK reads CLOUDINARY_URL during import, so bypass a malformed
    // redundant URL when all three explicit credentials are available.
    stage = "Cloudinary SDK import";
    console.log("[Upload] Importing cloudinary SDK...");
    const ignoreInvalidUrl = Boolean(hasExplicitCredentials && cloudinaryUrl && !hasValidCloudinaryUrl);
    const { v2: cloudinary } = await loadCloudinarySdk(ignoreInvalidUrl);

    // Cloudinary supports both three separate credentials and the single
    // CLOUDINARY_URL format commonly supplied by Vercel integrations.
    if (hasExplicitCredentials) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      // Calling config() with no arguments loads CLOUDINARY_URL from the
      // runtime environment without putting credentials in logs or responses.
      cloudinary.config();
      cloudinary.config({ secure: true });
    }

    const configured = cloudinary.config();
    if (!configured.cloud_name || !configured.api_key || !configured.api_secret) {
      console.error("[Upload] Cloudinary configuration resolved without all required credentials");
      return NextResponse.json(
        { error: "storage_not_configured", message: "Не удалось прочитать настройки Cloudinary на сервере." },
        { status: 503 }
      );
    }

    // ── 6. Загружаем в Cloudinary ─────────────────────────────────────────────
    stage = "Cloudinary upload";
    console.log("[Upload] Uploading to Cloudinary...");
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder:        "sierra-coffee/products",
      resource_type: "image",
    });

    stage = "database save";
    console.log("[Upload] Cloudinary upload completed");

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
    console.error(`[Upload] Failed during ${stage}:`, error instanceof Error ? error.stack : error);
    if (stage === "configuration") {
      return NextResponse.json(
        { error: "storage_not_configured", message: "Настройки Cloudinary некорректны. Проверьте CLOUDINARY_URL или три переменные Cloudinary в Vercel." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "upload_failed", message: "Не удалось загрузить изображение. Проверьте логи функции загрузки в Vercel." },
      { status: 500 }
    );
  }
}
