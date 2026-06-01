import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── A/R Aging Report (with optional provider filter) ───

router.get('/aging', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const providerId = req.query.providerId as string;
  const now = new Date();

  const invoiceWhere: Record<string, unknown> = {
    patient: { practiceId },
    status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
  };

  if (providerId) {
    invoiceWhere.treatments = { some: { providerId } };
  }

  const invoices = await prisma.invoice.findMany({
    where: invoiceWhere as any,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      payments: { select: { amount: true } },
    },
  });

  const buckets = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 };
  const details: unknown[] = [];

  for (const inv of invoices) {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    const balance = inv.total - paid;
    if (balance <= 0) continue;

    const daysPast = Math.floor(
      (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysPast <= 0) buckets.current += balance;
    else if (daysPast <= 30) buckets.days1to30 += balance;
    else if (daysPast <= 60) buckets.days31to60 += balance;
    else if (daysPast <= 90) buckets.days61to90 += balance;
    else buckets.over90 += balance;

    details.push({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patient: inv.patient,
      total: inv.total,
      paid: Math.round(paid * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      dueDate: inv.dueDate,
      daysPastDue: Math.max(0, daysPast),
      bucket:
        daysPast <= 0
          ? 'current'
          : daysPast <= 30
            ? '1-30'
            : daysPast <= 60
              ? '31-60'
              : daysPast <= 90
                ? '61-90'
                : '90+',
    });
  }

  // Round bucket totals
  for (const key of Object.keys(buckets) as Array<keyof typeof buckets>) {
    buckets[key] = Math.round(buckets[key] * 100) / 100;
  }

  const totalOutstanding =
    buckets.current + buckets.days1to30 + buckets.days31to60 + buckets.days61to90 + buckets.over90;

  res.json({
    buckets,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    details,
    count: details.length,
  });
});

// ─── Treatment Acceptance Rates ───

router.get('/treatment-acceptance', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const startDate = req.query.start
    ? new Date(req.query.start as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.end ? new Date(req.query.end as string) : new Date();

  const plans = await prisma.treatmentPlan.findMany({
    where: {
      patient: { practiceId },
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { status: true, totalFee: true, patientEst: true, createdAt: true },
  });

  const total = plans.length;
  const accepted = plans.filter((p) =>
    ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)
  ).length;
  const declined = plans.filter((p) => p.status === 'DECLINED').length;
  const pending = plans.filter((p) => ['PROPOSED', 'PRESENTED'].includes(p.status)).length;
  const totalValue = plans.reduce((s, p) => s + p.totalFee, 0);
  const acceptedValue = plans
    .filter((p) => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status))
    .reduce((s, p) => s + p.totalFee, 0);

  // Monthly breakdown
  const monthly: Record<string, { total: number; accepted: number }> = {};
  for (const plan of plans) {
    const key = `${plan.createdAt.getFullYear()}-${String(plan.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = { total: 0, accepted: 0 };
    monthly[key].total++;
    if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(plan.status)) {
      monthly[key].accepted++;
    }
  }

  const trend = Object.entries(monthly)
    .map(([month, data]) => ({
      month,
      ...data,
      rate: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  res.json({
    total,
    accepted,
    declined,
    pending,
    acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    totalValue: Math.round(totalValue * 100) / 100,
    acceptedValue: Math.round(acceptedValue * 100) / 100,
    trend,
  });
});

// ─── Provider Performance (production/collection) ───

router.get('/provider-performance', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const startDate = req.query.start
    ? new Date(req.query.start as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.end ? new Date(req.query.end as string) : new Date();

  const providers = await prisma.provider.findMany({
    where: { practiceId, isActive: true },
    select: { id: true, name: true, role: true },
  });

  const result = await Promise.all(
    providers.map(async (provider) => {
      const [treatments, appointments, completedAppointments] = await Promise.all([
        prisma.treatment.findMany({
          where: {
            providerId: provider.id,
            date: { gte: startDate, lte: endDate },
          },
          select: { fee: true },
        }),
        prisma.appointment.count({
          where: {
            providerId: provider.id,
            startTime: { gte: startDate, lte: endDate },
            status: { notIn: ['CANCELLED', 'RESCHEDULED'] },
          },
        }),
        prisma.appointment.count({
          where: {
            providerId: provider.id,
            startTime: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
        }),
      ]);

      const production = treatments.reduce((sum, t) => sum + t.fee, 0);

      return {
        providerId: provider.id,
        name: provider.name,
        role: provider.role,
        production: Math.round(production * 100) / 100,
        treatmentCount: treatments.length,
        totalAppointments: appointments,
        completedAppointments,
        completionRate:
          appointments > 0
            ? Math.round((completedAppointments / appointments) * 100)
            : 0,
      };
    })
  );

  res.json({ providers: result, period: { start: startDate, end: endDate } });
});

// ─── Daily Summary (end of day) ───

router.get('/daily-summary', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const dateParam = req.query.date as string;

  const targetDate = dateParam ? new Date(dateParam) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const [
    appointmentsByStatus,
    paymentsToday,
    newPatients,
    treatmentsPerformed,
    invoicesCreated,
  ] = await Promise.all([
    prisma.appointment.groupBy({
      by: ['status'],
      where: {
        provider: { practiceId },
        startTime: { gte: targetDate, lt: nextDay },
      },
      _count: true,
    }),
    prisma.payment.findMany({
      where: {
        invoice: { patient: { practiceId } },
        date: { gte: targetDate, lt: nextDay },
      },
      select: { amount: true, method: true },
    }),
    prisma.patient.count({
      where: {
        practiceId,
        createdAt: { gte: targetDate, lt: nextDay },
      },
    }),
    prisma.treatment.findMany({
      where: {
        provider: { practiceId },
        date: { gte: targetDate, lt: nextDay },
      },
      select: { fee: true, cdtCode: true },
    }),
    prisma.invoice.count({
      where: {
        patient: { practiceId },
        date: { gte: targetDate, lt: nextDay },
      },
    }),
  ]);

  const statusSummary: Record<string, number> = {};
  for (const group of appointmentsByStatus) {
    statusSummary[group.status] = group._count;
  }
  const totalAppointments = Object.values(statusSummary).reduce((a, b) => a + b, 0);

  const totalCollected = paymentsToday.reduce((s, p) => s + p.amount, 0);
  const paymentByMethod: Record<string, number> = {};
  for (const p of paymentsToday) {
    paymentByMethod[p.method] = (paymentByMethod[p.method] || 0) + p.amount;
  }

  const totalProduction = treatmentsPerformed.reduce((s, t) => s + t.fee, 0);

  res.json({
    date: targetDate.toISOString().split('T')[0],
    appointments: {
      total: totalAppointments,
      byStatus: statusSummary,
    },
    production: Math.round(totalProduction * 100) / 100,
    collections: {
      total: Math.round(totalCollected * 100) / 100,
      byMethod: paymentByMethod,
      transactionCount: paymentsToday.length,
    },
    newPatients,
    treatmentsPerformed: treatmentsPerformed.length,
    invoicesCreated,
  });
});

// ─── Revenue Trend (weekly/monthly) ───

router.get('/revenue-trend', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const period = (req.query.period as string) === 'weekly' ? 'weekly' : 'monthly';
  const months = Math.min(24, Math.max(1, parseInt(req.query.months as string) || 12));

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: {
      invoice: { patient: { practiceId } },
      date: { gte: startDate },
    },
    select: { amount: true, date: true },
    orderBy: { date: 'asc' },
  });

  const grouped: Record<string, number> = {};

  for (const payment of payments) {
    const date = new Date(payment.date);
    let key: string;
    if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    grouped[key] = (grouped[key] || 0) + payment.amount;
  }

  const data = Object.entries(grouped)
    .map(([periodKey, amount]) => ({
      period: periodKey,
      revenue: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const avgRevenue = data.length > 0 ? Math.round((totalRevenue / data.length) * 100) / 100 : 0;

  res.json({
    period,
    data,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averagePerPeriod: avgRevenue,
    dataPoints: data.length,
  });
});

export default router;
