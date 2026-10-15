/**
 * Добавляет новые роли в БД без потери существующих данных.
 * Запуск: npx tsx scripts/seed-roles.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = [
  // Существующие (upsert — обновит title если изменился)
  { code: "admin",           title: "Администратор" },
  { code: "manager",         title: "Менеджер" },
  { code: "staff",           title: "Сотрудник" },
  { code: "client",          title: "Клиент" },
  { code: "guest",           title: "Гость" },
  // Новые
  { code: "cashier",         title: "Кассир" },
  { code: "kitchen",         title: "Сотрудник кухни" },
  { code: "content_manager", title: "Контент-менеджер" },
];

async function main() {
  console.log("🌱 Seeding roles...");

  for (const role of ROLES) {
    const result = await prisma.role.upsert({
      where:  { code: role.code },
      update: { title: role.title },
      create: { code: role.code, title: role.title, permissions: {} },
    });
    console.log(`  ✅  ${result.code.padEnd(20)} → ${result.title} (id: ${result.id})`);
  }

  const total = await prisma.role.count();
  console.log(`\n✅  Done. Total roles in DB: ${total}`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
