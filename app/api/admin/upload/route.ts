import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { serializeBigInt } from "@/lib/bigint-utils";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "products.create");
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "validation_error", message: "Файл не предоставлен" },
        { status: 400 }
      );
    }

    // Проверка типа файла
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "Недопустимый тип файла. Разрешены: JPG, PNG, WebP",
        },
        { status: 400 }
      );
    }

    // Проверка размера файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "Размер файла превышает 5 МБ",
        },
        { status: 400 }
      );
    }

    // Создаём директорию, если не существует
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${extension}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Создаём запись в БД
    const fileRecord = await prisma.file.create({
      data: {
        url: `/uploads/${fileName}`,
        storageKey: fileName,
        mimeType: file.type,
        sizeBytes: BigInt(file.size),
        uploadedBy: auth.userId,
      },
    });

    return NextResponse.json({
      id: fileRecord.id,
      url: fileRecord.url,
      fileName: fileName,
      size: file.size,
      sizeBytes: serializeBigInt(fileRecord.sizeBytes),
    });
  } catch (error) {
    console.error("[Upload Error]", error);
    return handleApiError(error);
  }
}
