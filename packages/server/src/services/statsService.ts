import { prisma } from '../config/database';

export interface DailyStats {
  appointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  production: number;
  collections: number;
  newPatients: number;
}

export interface PeriodStats extends DailyStats {
  periodStart: Date;
  periodEnd: Date;
  averageDailyProduction: number;
}

export interface ProviderStatsResult {
  providerId: string;
  providerName: string;
  appointments: number;
  completedAppointments: number;
  production: number;
  collections: number;
}

export interface TrendDataPoint {
  label: string;
  periodStart: Date;
  periodEnd: Date;
  appointments: number;
  production: number;
  collections: number;
  newPatients: number;
}

/**
 * Get statistics for a single day.
 */
export async function getDailyStats(
  practiceId: string,
  date: Date
): Promise<DailyStats> {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return fetchStats(practiceId, dayStart, dayEnd);
}

/**
 * Get statistics for a week starting from the given date.
 */
export async function getWeeklyStats(
  practiceId: string,
  weekStart: Date
): Promise<PeriodStats> {
  const start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const stats = await fetchStats(practiceId, start, end);
  return {
    ...stats,
    periodStart: start,
    periodEnd: end,
    averageDailyProduction: Math.round((stats.production / 7) * 100) / 100,
  };
}

/**
 * Get statistics for a given month.
 */
export async function getMonthlyStats(
  practiceId: string,
  year: number,
  month: number
): Promise<PeriodStats> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const daysInMonth = Math.round(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
  );

  const stats = await fetchStats(practiceId, start, end);
  return {
    ...stats,
    periodStart: start,
    periodEnd: end,
    averageDailyProduction:
      Math.round((stats.production / daysInMonth) * 100) / 100,
  };
}

/**
 * Get statistics for a specific provider over a date range.
 */
export async function getProviderStats(
  providerId: string,
  dateRange: { start: Date; end: Date }
): Promise<ProviderStatsResult> {
  const provider = await prisma.provider.findUniqueOrThrow({
    where: { id: providerId },
    select: { id: true, name: true },
  });

  const [appointments, completedAppointments, productionAgg, collectionsAgg] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          providerId,
          startTime: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
      prisma.appointment.count({
        where: {
          providerId,
          startTime: { gte: dateRange.start, lte: dateRange.end },
          status: 'COMPLETED',
        },
      }),
      prisma.treatment.aggregate({
        _sum: { fee: true },
        where: {
          providerId,
          date: { gte: dateRange.start, lte: dateRange.end },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: dateRange.start, lte: dateRange.end },
          invoice: {
            treatments: { some: { providerId } },
          },
        },
      }),
    ]);

  return {
    providerId: provider.id,
    providerName: provider.name,
    appointments,
    completedAppointments,
    production: Math.round((productionAgg._sum.fee ?? 0) * 100) / 100,
    collections: Math.round((collectionsAgg._sum.amount ?? 0) * 100) / 100,
  };
}

/**
 * Get trend data broken into periods for charting.
 */
export async function getTrendData(
  practiceId: string,
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<TrendDataPoint[]> {
  const periods = buildPeriods(period);
  const results: TrendDataPoint[] = [];

  for (const p of periods) {
    const stats = await fetchStats(practiceId, p.start, p.end);
    results.push({
      label: p.label,
      periodStart: p.start,
      periodEnd: p.end,
      appointments: stats.appointments,
      production: stats.production,
      collections: stats.collections,
      newPatients: stats.newPatients,
    });
  }

  return results;
}

// ────────────────────────── Internal helpers ──────────────────────────

async function fetchStats(
  practiceId: string,
  start: Date,
  end: Date
): Promise<DailyStats> {
  const [
    appointments,
    completedAppointments,
    cancelledAppointments,
    productionAgg,
    collectionsAgg,
    newPatients,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: start, lt: end },
      },
    }),
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: start, lt: end },
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: start, lt: end },
        status: 'CANCELLED',
      },
    }),
    prisma.treatment.aggregate({
      _sum: { fee: true },
      where: {
        provider: { practiceId },
        date: { gte: start, lt: end },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: start, lt: end },
        invoice: { patient: { practiceId } },
      },
    }),
    prisma.patient.count({
      where: {
        practiceId,
        createdAt: { gte: start, lt: end },
      },
    }),
  ]);

  return {
    appointments,
    completedAppointments,
    cancelledAppointments,
    production: Math.round((productionAgg._sum.fee ?? 0) * 100) / 100,
    collections: Math.round((collectionsAgg._sum.amount ?? 0) * 100) / 100,
    newPatients,
  };
}

interface PeriodDef {
  label: string;
  start: Date;
  end: Date;
}

function buildPeriods(period: 'week' | 'month' | 'quarter' | 'year'): PeriodDef[] {
  const now = new Date();
  const periods: PeriodDef[] = [];

  switch (period) {
    case 'week': {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - i * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        periods.push({
          label: `W${start.toISOString().split('T')[0]}`,
          start,
          end,
        });
      }
      break;
    }
    case 'month': {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        periods.push({
          label: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
          start,
          end,
        });
      }
      break;
    }
    case 'quarter': {
      // Last 8 quarters
      for (let i = 7; i >= 0; i--) {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const start = new Date(now.getFullYear(), quarterMonth - i * 3, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 3, 1);
        const q = Math.floor(start.getMonth() / 3) + 1;
        periods.push({
          label: `Q${q} ${start.getFullYear()}`,
          start,
          end,
        });
      }
      break;
    }
    case 'year': {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const start = new Date(now.getFullYear() - i, 0, 1);
        const end = new Date(now.getFullYear() - i + 1, 0, 1);
        periods.push({
          label: `${start.getFullYear()}`,
          start,
          end,
        });
      }
      break;
    }
  }

  return periods;
}
