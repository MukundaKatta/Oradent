import cron from 'node-cron';
import { format } from 'date-fns';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { sendEmail, generateAppointmentReminderEmail } from '../services/emailService';

export function startAppointmentReminders(): void {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const settings = await prisma.practiceSettings.findFirst({
        include: { practice: { select: { name: true, phone: true } } },
      });
      const hoursAhead = settings?.reminderHoursBefore || 24;
      const practiceName = settings?.practice?.name || 'Our Dental Practice';
      const practicePhone = settings?.practice?.phone || '';
      const now = new Date();
      const reminderTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const reminderWindowEnd = new Date(reminderTime.getTime() + 60 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
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
        logger.info(
          { appointmentId: apt.id, patientName: `${apt.patient.firstName} ${apt.patient.lastName}` },
          'Sending appointment reminder'
        );

        if (apt.patient.email) {
          const html = generateAppointmentReminderEmail(
            `${apt.patient.firstName} ${apt.patient.lastName}`,
            format(apt.startTime, 'EEEE, MMMM d, yyyy'),
            format(apt.startTime, 'h:mm a'),
            apt.provider.name,
            practiceName,
            practicePhone
          );
          await sendEmail(apt.patient.email, 'Appointment Reminder', html);
        }

        await prisma.appointment.update({
          where: { id: apt.id },
          data: { reminderSent: true },
        });
      }

      if (appointments.length > 0) {
        logger.info(`Processed ${appointments.length} appointment reminders`);
      }
    } catch (error) {
      logger.error(error, 'Appointment reminder job failed');
    }
  });

  logger.info('Appointment reminder job scheduled');
}
