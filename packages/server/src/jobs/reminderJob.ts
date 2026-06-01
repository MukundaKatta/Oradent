import cron from 'node-cron';
import { logger } from '../utils/logger';
import { getUpcomingReminders, sendReminder } from '../services/appointmentReminderService';
import { prisma } from '../config/database';

/**
 * Start the hourly appointment-reminder job.
 * Finds appointments in the next 24 hours that haven't had a reminder sent
 * and marks them as reminded.
 */
export function startReminderJob(): void {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      // Look up the default practice to get reminder settings
      const settings = await prisma.practiceSettings.findFirst();
      const hoursAhead = settings?.reminderHoursBefore ?? 24;

      // We need a practiceId – iterate all practices
      const practices = await prisma.practice.findMany({ select: { id: true } });

      let totalSent = 0;

      for (const practice of practices) {
        const appointments = await getUpcomingReminders(practice.id, hoursAhead);

        for (const apt of appointments) {
          const method = apt.patient.email ? 'email' : 'sms';
          const result = await sendReminder(apt.id, method);
          if (result.status === 'sent') {
            totalSent += 1;
          }
        }
      }

      if (totalSent > 0) {
        logger.info(`Reminder job: sent ${totalSent} reminders`);
      }
    } catch (error) {
      logger.error(error, 'Reminder job failed');
    }
  });

  logger.info('Reminder job scheduled (hourly)');
}
