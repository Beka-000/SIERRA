import { prisma } from "./prisma";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "login"
  | "logout"
  | "export";

export type AuditEntity =
  | "order"
  | "product"
  | "category"
  | "user"
  | "promocode"
  | "review"
  | "modifier"
  | "reservation"
  | "settings";

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entityType: AuditEntity;
  entityId?: string;
  details?: Record<string, unknown>;
}

/**
 * Записывает действие в audit log
 */
export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        details: details as any ?? {},
      },
    });
  } catch (error) {
    console.error("[Audit Log Error]", error);
  }
}
