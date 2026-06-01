import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface ReminderRecord {
  appointmentId: string;
  method: 'email' | 'sms';
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}

// In-memory reminder history (placeholder until a dedicated table is added)
const reminderHistory: ReminderRecord[] = [];

/**
 * Find upcoming appointments that still need a reminder sent.
 */
export async function getUpcomingReminders(practiceId: string, hoursAhead: number) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      provider: { practiceId },
      startTime: { gte: now, lte: cutoff },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
      reminderSent: false,
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      provider: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  return appointments;
}

/**
 * Mark a reminder as sent for a given appointment and record the attempt.
 */
export async function sendReminder(
  appointmentId: string,
  method: 'email' | 'sms',
): Promise<ReminderRecord> {
  const record: ReminderRecord = {
    appointmentId,
    method,
    sentAt: new Date(),
    status: 'sent',
  };

  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });

    reminderHistory.push(record);
    logger.info({ appointmentId, method }, 'Reminder marked as sent');
  } catch (error) {
    record.status = 'failed';
    record.error = error instanceof Error ? error.message : 'Unknown error';
    reminderHistory.push(record);
    logger.error({ appointmentId, method, error }, 'Failed to send reminder');
  }

  return record;
}

/**
 * Retrieve the reminder history log for a specific appointment.
 */
export function getReminderHistory(appointmentId: string): ReminderRecord[] {
  return reminderHistory.filter((r) => r.appointmentId === appointmentId);
}
