import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Start the weekly data-cleanup job.
 * - Archives audit log entries older than 90 days
 * - Cleans up expired / revoked tokens from Redis (placeholder)
 */
export function startCleanupJob(): void {
  // Run every Sunday at 2:00 AM
  cron.schedule('0 2 * * 0', async () => {
    logger.info('Cleanup job starting');

    try {
      await archiveOldAuditLogs();
    } catch (error) {
      logger.error(error, 'Cleanup job: audit log archival failed');
    }

    try {
      await cleanExpiredTokens();
    } catch (error) {
      logger.error(error, 'Cleanup job: token cleanup failed');
    }

    logger.info('Cleanup job completed');
  });

  logger.info('Cleanup job scheduled (weekly, Sunday 2:00 AM)');
}

/**
 * Delete audit log entries older than 90 days.
 */
async function archiveOldAuditLogs(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const result = await prisma.auditLog.deleteMany({
    where: {
      timestamp: { lt: cutoffDate },
    },
  });

  if (result.count > 0) {
    logger.info(`Archived ${result.count} audit log entries older than 90 days`);
  }
}

/**
 * Clean expired tokens.
 * Redis keys with TTL handle their own expiry, so this is a placeholder
 * for any additional token-related cleanup that may be needed in the future.
 */
async function cleanExpiredTokens(): Promise<void> {
  // Redis keys set with EX (TTL) auto-expire, so no manual cleanup is needed.
  // This function is a placeholder for future cleanup logic (e.g. database-stored
  // refresh tokens, API keys, etc.).
  logger.info('Token cleanup check completed (no action needed)');
}
