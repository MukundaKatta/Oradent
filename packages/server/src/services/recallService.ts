import { prisma } from '../config/database';
import { addMonths } from 'date-fns';

export async function getPatientsForRecall(practiceId: string, daysAhead: number = 30) {
  const cutoffDate = addMonths(new Date(), -6); // 6 months since last cleaning
  return prisma.patient.findMany({
    where: {
      practiceId,
      status: 'ACTIVE',
      appointments: {
        none: {
          type: 'CLEANING',
          startTime: { gte: cutoffDate },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] },
        },
      },
    },
    include: {
      appointments: {
        where: { type: 'CLEANING', status: 'COMPLETED' },
        orderBy: { startTime: 'desc' },
        take: 1,
      },
    },
  });
}

export async function getRecallStats(practiceId: string) {
  const sixMonthsAgo = addMonths(new Date(), -6);
  const [dueCount, overdueCount, scheduledCount] = await Promise.all([
    prisma.patient.count({
      where: { practiceId, status: 'ACTIVE', lastVisit: { lte: sixMonthsAgo } },
    }),
    prisma.patient.count({
      where: { practiceId, status: 'ACTIVE', lastVisit: { lte: addMonths(new Date(), -8) } },
    }),
    prisma.appointment.count({
      where: {
        patient: { practiceId },
        type: 'CLEANING',
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: { gte: new Date() },
      },
    }),
  ]);
  return { dueCount, overdueCount, scheduledCount };
}
