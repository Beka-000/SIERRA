/**
 * RBAC (Role-Based Access Control)
 * Система управления правами доступа
 */

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
  | "audit.view";

export type Role = "admin" | "manager" | "staff" | "client";

/**
 * Матрица прав доступа по ролям
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Full access
    "orders.view",
    "orders.create",
    "orders.update",
    "orders.delete",
    "orders.status_change",
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "categories.view",
    "categories.create",
    "categories.update",
    "categories.delete",
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
    "users.block",
    "promocodes.view",
    "promocodes.create",
    "promocodes.update",
    "promocodes.delete",
    "reviews.view",
    "reviews.moderate",
    "reviews.delete",
    "analytics.view",
    "analytics.export",
    "settings.view",
    "settings.update",
    "audit.view",
  ],

  manager: [
    // Orders management
    "orders.view",
    "orders.create",
    "orders.update",
    "orders.status_change",
    // Products management
    "products.view",
    "products.update",
    // View only
    "categories.view",
    "users.view",
    "promocodes.view",
    // Reviews
    "reviews.view",
    "reviews.moderate",
    // Analytics
    "analytics.view",
  ],

  staff: [
    // Limited orders
    "orders.view",
    "orders.status_change",
    // View products
    "products.view",
    "categories.view",
  ],

  client: [],
};

/**
 * Проверяет, есть ли у роли определённое право
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Проверяет, есть ли у роли хотя бы одно из прав
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Проверяет, есть ли у роли все указанные права
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Возвращает все права для роли
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
