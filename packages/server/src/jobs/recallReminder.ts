import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export function startRecallReminders(): void {
  // Run daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const dueRecalls = await prisma.recallSchedule.findMany({
        where: {
          nextDue: { lte: now },
          status: 'DUE',
        },
        include: {
          patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      });

      for (const recall of dueRecalls) {
        if (recall.nextDue < thirtyDaysAgo) {
          logger.info(
            { recallId: recall.id, patientName: `${recall.patient.firstName} ${recall.patient.lastName}` },
            'Recall is overdue – updating status'
          );

          await prisma.recallSchedule.update({
            where: { id: recall.id },
            data: { status: 'OVERDUE' },
          });
        }
      }

      if (dueRecalls.length > 0) {
        logger.info(`Processed ${dueRecalls.length} recall reminders`);
      }
    } catch (error) {
      logger.error(error, 'Recall reminder job failed');
    }
  });

  logger.info('Recall reminder job scheduled');
}
