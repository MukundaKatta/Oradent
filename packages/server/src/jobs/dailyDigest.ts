import cron from 'node-cron';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/emailService';

function generateDailyDigestEmail(
  practiceName: string,
  dateLabel: string,
  tomorrowAppointments: number,
  overdueInvoices: number,
  unsignedNotes: number,
  pendingClaims: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'DM Sans', Arial, sans-serif; background-color: #fafaf9; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e7e5e4;">
        <h1 style="color: #0d9488; font-size: 24px; margin: 0 0 8px;">Daily Digest</h1>
        <p style="color: #57534e; font-size: 14px; margin: 0 0 24px;">${practiceName} &mdash; ${dateLabel}</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f0fdfa;">
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: #1c1917; font-weight: 600;">Tomorrow's Appointments</td>
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: #1c1917; text-align: right; font-size: 18px; font-weight: 700;">${tomorrowAppointments}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: #1c1917; font-weight: 600;">Overdue Invoices</td>
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: ${overdueInvoices > 0 ? '#dc2626' : '#1c1917'}; text-align: right; font-size: 18px; font-weight: 700;">${overdueInvoices}</td>
          </tr>
          <tr style="background: #f0fdfa;">
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: #1c1917; font-weight: 600;">Unsigned Notes</td>
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: ${unsignedNotes > 0 ? '#f59e0b' : '#1c1917'}; text-align: right; font-size: 18px; font-weight: 700;">${unsignedNotes}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: #1c1917; font-weight: 600;">Pending Insurance Claims</td>
            <td style="padding: 12px 16px; border: 1px solid #e7e5e4; color: #1c1917; text-align: right; font-size: 18px; font-weight: 700;">${pendingClaims}</td>
          </tr>
        </table>

        <p style="color: #a8a29e; font-size: 12px; margin-top: 32px; text-align: center;">
          ${practiceName} &mdash; Daily Digest
        </p>
      </div>
    </body>
    </html>
  `;
}

export function startDailyDigest(): void {
  // Run at 7am on weekdays
  cron.schedule('0 7 * * 1-5', async () => {
    try {
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const tomorrowStart = startOfDay(tomorrow);
      const tomorrowEnd = endOfDay(tomorrow);
      const dateLabel = format(today, 'EEEE, MMMM d, yyyy');

      const practices = await prisma.practice.findMany({
        select: { id: true, name: true },
      });

      for (const practice of practices) {
        const [tomorrowAppointments, pendingClaims, overdueInvoices, unsignedNotes] = await Promise.all([
          prisma.appointment.count({
            where: {
              provider: { practiceId: practice.id },
              startTime: { gte: tomorrowStart, lte: tomorrowEnd },
              status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
          }),
          prisma.insuranceClaim.count({
            where: {
              invoice: { patient: { practiceId: practice.id } },
              status: { in: ['SUBMITTED', 'IN_REVIEW'] },
            },
          }),
          prisma.invoice.count({
            where: {
              patient: { practiceId: practice.id },
              status: 'OVERDUE',
            },
          }),
          prisma.clinicalNote.count({
            where: {
              provider: { practiceId: practice.id },
              signedAt: null,
            },
          }),
        ]);

        const html = generateDailyDigestEmail(
          practice.name,
          dateLabel,
          tomorrowAppointments,
          overdueInvoices,
          unsignedNotes,
          pendingClaims
        );

        // Send to all active providers in this practice
        const providers = await prisma.provider.findMany({
          where: { practiceId: practice.id, isActive: true },
          select: { email: true },
        });

        for (const provider of providers) {
          await sendEmail(provider.email, `Daily Digest - ${format(today, 'MMM d')}`, html);
        }

        logger.info(
          {
            practice: practice.name,
            tomorrowAppointments,
            pendingClaims,
            overdueInvoices,
            unsignedNotes,
            recipientCount: providers.length,
          },
          'Daily digest sent'
        );
      }
    } catch (error) {
      logger.error(error, 'Daily digest job failed');
    }
  });

  logger.info('Daily digest job scheduled');
}
