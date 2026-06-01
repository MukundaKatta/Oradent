import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export function startOverdueInvoiceCheck(): void {
  // Run daily at 6am
  cron.schedule('0 6 * * *', async () => {
    try {
      const result = await prisma.invoice.updateMany({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
        data: { status: 'OVERDUE' },
      });
      if (result.count > 0) {
        logger.info(`Marked ${result.count} invoices as overdue`);
      }
    } catch (error) {
      logger.error(error, 'Overdue invoice check failed');
    }
  });
  logger.info('Overdue invoice check job scheduled');
}
