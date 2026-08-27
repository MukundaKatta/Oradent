import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export function startAppointmentReminders(): void {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const practices = await prisma.practice.findMany({
        select: { id: true, settings: { select: { reminderHoursBefore: true } } },
      });

      let totalProcessed = 0;

      for (const practice of practices) {
        const hoursAhead = practice.settings?.reminderHoursBefore || 24;
        const now = new Date();
        const reminderTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
        const reminderWindowEnd = new Date(reminderTime.getTime() + 60 * 60 * 1000);

        const appointments = await prisma.appointment.findMany({
          where: {
            provider: { practiceId: practice.id },
            startTime: { gte: reminderTime, lt: reminderWindowEnd },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
            reminderSent: false,
          },
          include: {
            patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
            provider: { select: { name: true } },
            chair: { select: { name: true } },
          },
        });

        for (const apt of appointments) {
          // In production, send email/SMS here
          logger.info(
            { appointmentId: apt.id, patientName: `${apt.patient.firstName} ${apt.patient.lastName}` },
            'Would send appointment reminder'
          );

          await prisma.appointment.update({
            where: { id: apt.id },
            data: { reminderSent: true },
          });
        }

        totalProcessed += appointments.length;
      }

      if (totalProcessed > 0) {
        logger.info(`Processed ${totalProcessed} appointment reminders`);
      }
    } catch (error) {
      logger.error(error, 'Appointment reminder job failed');
    }
  });

  logger.info('Appointment reminder job scheduled');
}
