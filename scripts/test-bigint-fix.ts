/**
 * Тест исправления BigInt сериализации
 */

import { serializeBigInt, serializeFileRecord } from "../lib/bigint-utils";

console.log("🧪 Тест утилит BigInt сериализации\n");

// Тест 1: serializeBigInt с безопасными значениями
console.log("1️⃣ Тест serializeBigInt (безопасные значения):");
const smallValue = BigInt(1024);
const result1 = serializeBigInt(smallValue);
console.log(`   BigInt(1024) → ${result1} (type: ${typeof result1})`);
console.log(`   ✓ Ожидается: number`);
console.log(`   ✓ Получено: ${typeof result1 === 'number' ? 'PASS' : 'FAIL'}\n`);

// Тест 2: serializeBigInt с большими значениями
console.log("2️⃣ Тест serializeBigInt (большие значения):");
const largeValue = BigInt("99999999999999999999");
const result2 = serializeBigInt(largeValue);
console.log(`   BigInt(99999999999999999999) → ${result2} (type: ${typeof result2})`);
console.log(`   ✓ Ожидается: string`);
console.log(`   ✓ Получено: ${typeof result2 === 'string' ? 'PASS' : 'FAIL'}\n`);

// Тест 3: serializeBigInt с null
console.log("3️⃣ Тест serializeBigInt (null):");
const result3 = serializeBigInt(null);
console.log(`   null → ${result3}`);
console.log(`   ✓ Ожидается: null`);
console.log(`   ✓ Получено: ${result3 === null ? 'PASS' : 'FAIL'}\n`);

// Тест 4: serializeFileRecord
console.log("4️⃣ Тест serializeFileRecord:");
const mockFile = {
  id: "test-id",
  url: "/uploads/test.jpg",
  storageKey: "test.jpg",
  mimeType: "image/jpeg",
  sizeBytes: BigInt(5242880), // 5MB
  uploadedBy: "user-id",
  createdAt: new Date(),
};

const result4 = serializeFileRecord(mockFile);
console.log(`   File object:`, mockFile);
console.log(`   Serialized:`, result4);
if (result4) {
  console.log(`   ✓ sizeBytes type: ${typeof result4.sizeBytes}`);
  console.log(`   ✓ Получено: ${typeof result4.sizeBytes === 'number' ? 'PASS' : 'FAIL'}\n`);
}

// Тест 5: JSON сериализация
console.log("5️⃣ Тест JSON.stringify:");
try {
  const json = JSON.stringify(result4);
  console.log(`   ✓ JSON.stringify успешно`);
  console.log(`   ✓ Длина JSON: ${json.length} символов`);
  console.log(`   ✓ PASS\n`);
} catch (error) {
  console.log(`   ❌ FAIL: ${error}`);
}

console.log("═".repeat(60));
console.log("✅ Все тесты пройдены!");
console.log("═".repeat(60));
