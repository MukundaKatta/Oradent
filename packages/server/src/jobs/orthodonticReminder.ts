import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// ORTHO-08: scans OrthodonticVisit.nextVisitDate for visits due within the
// practice's configured reminder window and logs them — same placeholder
// pattern as appointmentReminder.ts (no real email/SMS send). Unlike the
// appointment reminder, there is no `reminderSent` flag on OrthodonticVisit,
// so a visit still inside the window is logged again on every run; the spec
// (P2: Lembrete de retorno, AC1) asks for "a cada execução", not once.
export function startOrthodonticReminders(): void {
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

        const visits = await prisma.orthodonticVisit.findMany({
          where: {
            nextVisitDate: { gte: reminderTime, lt: reminderWindowEnd },
            // Only cases still under active treatment get a reminder — a
            // visit's nextVisitDate lingering on a RETENTION/COMPLETED/
            // DISCONTINUED case shouldn't page anyone about a follow-up.
            case: { status: 'ACTIVE', patient: { practiceId: practice.id } },
          },
          include: {
            case: { include: { patient: { select: { firstName: true, lastName: true } } } },
          },
        });

        for (const visit of visits) {
          // In production, send email/SMS here
          logger.info(
            {
              visitId: visit.id,
              caseId: visit.caseId,
              patientName: `${visit.case.patient.firstName} ${visit.case.patient.lastName}`,
              nextVisitDate: visit.nextVisitDate,
            },
            'Would send orthodontic visit reminder'
          );
        }

        totalProcessed += visits.length;
      }

      if (totalProcessed > 0) {
        logger.info(`Processed ${totalProcessed} orthodontic visit reminders`);
      }
    } catch (error) {
      logger.error(error, 'Orthodontic reminder job failed');
    }
  });

  logger.info('Orthodontic reminder job scheduled');
}
