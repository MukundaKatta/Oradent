import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
}

export enum AuditResource {
  PATIENT = 'PATIENT',
  APPOINTMENT = 'APPOINTMENT',
  BILLING = 'BILLING',
  TREATMENT = 'TREATMENT',
  SETTINGS = 'SETTINGS',
  REPORT = 'REPORT',
}

export interface AuditLogEntry {
  id: string;
  providerId: string | null;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: Date;
}

/**
 * Centralized audit logging service.
 * Writes structured audit entries to the AuditLog table via Prisma.
 */
export async function logAction(
  providerId: string,
  action: AuditAction,
  resource: AuditResource,
  resourceId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        providerId,
        action,
        resource,
        resourceId,
        details: (details ?? {}) as any,
        ipAddress: ipAddress ?? '',
      },
    });
  } catch (error) {
    // Audit logging should never break the calling operation
    logger.error(error, 'Failed to write audit log entry');
  }
}

/**
 * Query audit log entries with optional filters.
 */
export async function queryAuditLogs(options: {
  providerId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const where: Record<string, unknown> = {};

  if (options.providerId) where.providerId = options.providerId;
  if (options.action) where.action = options.action;
  if (options.resource) where.resource = options.resource;
  if (options.resourceId) where.resourceId = options.resourceId;

  if (options.startDate || options.endDate) {
    const timestamp: Record<string, Date> = {};
    if (options.startDate) timestamp.gte = options.startDate;
    if (options.endDate) timestamp.lte = options.endDate;
    where.timestamp = timestamp;
  }

  const rows = await prisma.auditLog.findMany({
    where: where as any,
    include: { provider: { select: { name: true, email: true } } },
    orderBy: { timestamp: 'desc' },
    take: options.limit ?? 50,
    skip: options.offset ?? 0,
  });

  return rows as unknown as AuditLogEntry[];
}
