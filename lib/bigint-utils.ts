/**
 * Утилиты для безопасной сериализации BigInt и Decimal в JSON
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Преобразует BigInt или Decimal в число, если значение помещается в безопасный диапазон JavaScript
 * Иначе преобразует в строку для сохранения точности
 */
export function serializeBigInt(value: bigint | Decimal | null | undefined): number | string | null {
  if (value === null || value === undefined) return null;
  
  // Если это Decimal из Prisma, конвертируем в число
  if (value instanceof Decimal) {
    return value.toNumber();
  }
  
  // Если это BigInt
  if (typeof value === 'bigint') {
    // Безопасный диапазон: Number.MIN_SAFE_INTEGER до Number.MAX_SAFE_INTEGER
    // -9007199254740991 до 9007199254740991
    const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
    const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
    
    if (value >= MIN_SAFE && value <= MAX_SAFE) {
      return Number(value);
    }
    
    // Если значение выходит за безопасный диапазон, возвращаем строку
    return value.toString();
  }
  
  return null;
}

/**
 * Преобразует объект, содержащий BigInt, в JSON-безопасный объект
 */
export function serializeObject<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return obj;
  
  const result: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    const value = obj[key];
    
    if (typeof value === 'bigint') {
      result[key] = serializeBigInt(value);
    } else if (value !== null && typeof value === 'object') {
      result[key] = serializeObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Преобразует File объект из Prisma в JSON-безопасный формат
 */
export function serializeFileRecord(file: any) {
  if (!file) return null;
  
  return {
    id: file.id,
    url: file.url,
    storageKey: file.storageKey,
    mimeType: file.mimeType,
    sizeBytes: serializeBigInt(file.sizeBytes),
    uploadedBy: file.uploadedBy,
    createdAt: file.createdAt,
  };
}
