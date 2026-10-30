/**
 * RBAC (Role-Based Access Control)
 * Система управления правами доступа Sierra Coffee
 */

// ─── Типы разрешений ──────────────────────────────────────────────────────────

export type Permission =
  // Orders
  | "orders.view"
  | "orders.create"
  | "orders.update"
  | "orders.delete"
  | "orders.status_change"
  // Products
  | "products.view"
  | "products.create"
  | "products.update"
  | "products.delete"
  // Categories
  | "categories.view"
  | "categories.create"
  | "categories.update"
  | "categories.delete"
  // Users
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "users.block"
  | "users.assign_role"   // только admin
  // Promocodes
  | "promocodes.view"
  | "promocodes.create"
  | "promocodes.update"
  | "promocodes.delete"
  // Reviews
  | "reviews.view"
  | "reviews.moderate"
  | "reviews.delete"
  // Analytics
  | "analytics.view"
  | "analytics.export"
  // Settings
  | "settings.view"
  | "settings.update"
  // Audit
  | "audit.view"
  // Reservations
  | "reservations.view"
  | "reservations.create"
  | "reservations.update"
  | "reservations.status_change"
  | "reservations.delete";

// ─── Типы ролей ───────────────────────────────────────────────────────────────

export type Role =
  | "admin"
  | "manager"
  | "cashier"
  | "kitchen"
  | "content_manager"
  | "staff"     // legacy — оставляем для обратной совместимости
  | "client"
  | "guest";

// ─── Метаданные ролей (для UI) ────────────────────────────────────────────────

export interface RoleMeta {
  code: Role;
  title: string;          // отображаемое название
  titleRu: string;        // русское название
  description: string;    // краткое описание для UI
  isAdminRole: boolean;   // имеет доступ к admin-панели
  color: "gold" | "blue" | "green" | "orange" | "purple" | "gray" | "red";
}

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: {
    code: "admin",
    title: "Administrator",
    titleRu: "Администратор",
    description: "Полный доступ ко всем функциям системы, управление ролями сотрудников",
    isAdminRole: true,
    color: "gold",
  },
  manager: {
    code: "manager",
    title: "Manager",
    titleRu: "Менеджер",
    description: "Управление заказами, просмотр клиентов, модерация отзывов и промокодов",
    isAdminRole: true,
    color: "blue",
  },
  cashier: {
    code: "cashier",
    title: "Cashier",
    titleRu: "Кассир",
    description: "Просмотр и создание заказов, изменение разрешённых статусов",
    isAdminRole: true,
    color: "green",
  },
  kitchen: {
    code: "kitchen",
    title: "Kitchen Staff",
    titleRu: "Сотрудник кухни",
    description: "Просмотр заказов для приготовления, обновление кухонных статусов",
    isAdminRole: true,
    color: "orange",
  },
  content_manager: {
    code: "content_manager",
    title: "Content Manager",
    titleRu: "Контент-менеджер",
    description: "Управление товарами, категориями, описаниями и изображениями",
    isAdminRole: true,
    color: "purple",
  },
  staff: {
    code: "staff",
    title: "Staff",
    titleRu: "Сотрудник",
    description: "Базовый доступ к заказам (legacy-роль)",
    isAdminRole: true,
    color: "gray",
  },
  client: {
    code: "client",
    title: "Client",
    titleRu: "Клиент",
    description: "Доступ только к пользовательской части сайта",
    isAdminRole: false,
    color: "gray",
  },
  guest: {
    code: "guest",
    title: "Guest",
    titleRu: "Гость",
    description: "Ограниченный доступ без авторизации",
    isAdminRole: false,
    color: "gray",
  },
};

// ─── Матрица прав ─────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {

  /** Администратор — полный доступ */
  admin: [
    "orders.view", "orders.create", "orders.update", "orders.delete", "orders.status_change",
    "products.view", "products.create", "products.update", "products.delete",
    "categories.view", "categories.create", "categories.update", "categories.delete",
    "users.view", "users.create", "users.update", "users.delete", "users.block", "users.assign_role",
    "promocodes.view", "promocodes.create", "promocodes.update", "promocodes.delete",
    "reviews.view", "reviews.moderate", "reviews.delete",
    "analytics.view", "analytics.export",
    "settings.view", "settings.update",
    "audit.view",
    "reservations.view", "reservations.create", "reservations.update", "reservations.status_change", "reservations.delete",
  ],

  /** Менеджер — управление операциями, без назначения ролей */
  manager: [
    "orders.view", "orders.create", "orders.update", "orders.status_change",
    "products.view", "products.update",
    "categories.view",
    "users.view",
    "promocodes.view", "promocodes.create", "promocodes.update",
    "reviews.view", "reviews.moderate",
    "analytics.view",
    "reservations.view", "reservations.update", "reservations.status_change",
  ],

  /** Кассир — только заказы */
  cashier: [
    "orders.view", "orders.create", "orders.status_change",
    "products.view",
    "categories.view",
    "users.view",
  ],

  /** Сотрудник кухни — только кухонные операции */
  kitchen: [
    "orders.view", "orders.status_change",
    "products.view",
    "categories.view",
  ],

  /** Контент-менеджер — управление каталогом */
  content_manager: [
    "products.view", "products.create", "products.update",
    "categories.view", "categories.create", "categories.update",
  ],

  /** Staff — legacy-роль с базовым доступом */
  staff: [
    "orders.view", "orders.status_change",
    "products.view",
    "categories.view",
    "reservations.view", "reservations.status_change",
  ],

  /** Клиент — нет прав на admin-панель */
  client: [],

  /** Гость — нет прав */
  guest: [],
};

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/** Проверяет наличие конкретного права */
export function hasPermission(role: Role | string, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role as Role] ?? []).includes(permission);
}

/** Проверяет наличие хотя бы одного из прав */
export function hasAnyPermission(role: Role | string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Проверяет наличие всех указанных прав */
export function hasAllPermissions(role: Role | string, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/** Возвращает все права роли */
export function getRolePermissions(role: Role | string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] ?? [];
}

/** Является ли роль административной (имеет доступ к admin-панели) */
export function isAdminRole(role: Role | string): boolean {
  return ROLE_META[role as Role]?.isAdminRole ?? false;
}

/** Может ли роль `actorRole` назначить роль `targetRole` пользователю */
export function canAssignRole(actorRole: Role | string, targetRole: Role | string): boolean {
  // Только admin может назначать роли
  if (actorRole !== "admin") return false;
  // Нельзя назначать роль guest (техническая)
  if (targetRole === "guest") return false;
  return true;
}

/** Возвращает список ролей, доступных для назначения через UI */
export function getAssignableRoles(): RoleMeta[] {
  const assignable: Role[] = ["admin", "manager", "cashier", "kitchen", "content_manager", "client"];
  return assignable.map((r) => ROLE_META[r]);
}

/** Возвращает цвет для бейджа роли */
export function getRoleBadgeVariant(
  roleCode: string
): "success" | "warning" | "error" | "info" | "default" {
  const map: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
    admin:           "error",    // красный/золотой — наиболее привилегированный
    manager:         "info",
    cashier:         "success",
    kitchen:         "warning",
    content_manager: "info",
    staff:           "default",
    client:          "default",
    guest:           "default",
  };
  return map[roleCode] ?? "default";
}
