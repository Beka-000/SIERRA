/**
 * Cloudinary — конфигурация серверного SDK.
 *
 * Используется для загрузки и удаления изображений (админ-панель, товары).
 * Учётные данные хранятся в переменных окружения (.env):
 *   - CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 *
 * NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME нужен для построения CDN-URL на клиенте.
 */

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

// Настраиваем один раз при первом импорте модуля.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true, // всегда HTTPS
});

/** Проверяет, что все обязательные переменные окружения заданы. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Папка по умолчанию для загрузок из админ-панели.
 * Cloudinary автоматически создаёт папку при первой загрузке.
 */
export const DEFAULT_UPLOAD_FOLDER = "sierra-coffee/products";

export { cloudinary, type UploadApiResponse };
