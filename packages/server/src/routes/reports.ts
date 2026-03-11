import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Dashboard stats
router.get('/dashboard', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todayAppointments,
    monthRevenue,
    activePatients,
    pendingClaims,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: today, lt: tomorrow },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        invoice: { patient: { practiceId } },
        date: { gte: monthStart },
      },
    }),
    prisma.patient.count({
      where: { practiceId, status: 'ACTIVE' },
    }),
    prisma.insuranceClaim.count({
      where: {
        invoice: { patient: { practiceId } },
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      },
    }),
  ]);

  res.json({
    todayAppointments,
    monthRevenue: monthRevenue._sum.amount || 0,
    activePatients,
    pendingClaims,
  });
});

// Revenue report
router.get('/revenue', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const period = (req.query.period as string) || 'month';
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = req.query.end ? new Date(req.query.end as string) : new Date();

  const payments = await prisma.payment.findMany({
    where: {
      invoice: { patient: { practiceId } },
      date: { gte: startDate, lte: endDate },
    },
    include: {
      invoice: {
        select: { patientId: true, total: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Group by period
  const grouped: Record<string, number> = {};
  for (const payment of payments) {
    const date = new Date(payment.date);
    let key: string;
    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    grouped[key] = (grouped[key] || 0) + payment.amount;
  }

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    data: Object.entries(grouped).map(([period, amount]) => ({ period, amount })),
    total,
    startDate,
    endDate,
  });
});

// Procedure mix
router.get('/procedures', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const startDate = req.query.start ? new Date(req.query.start as string) : new Date(new Date().getFullYear(), 0, 1);

  const treatments = await prisma.treatment.findMany({
    where: {
      provider: { practiceId },
      date: { gte: startDate },
    },
    select: { cdtCode: true, description: true, fee: true },
  });

  const procedureMap: Record<string, { count: number; revenue: number; description: string }> = {};
  for (const t of treatments) {
    if (!procedureMap[t.cdtCode]) {
      procedureMap[t.cdtCode] = { count: 0, revenue: 0, description: t.description };
    }
    procedureMap[t.cdtCode].count++;
    procedureMap[t.cdtCode].revenue += t.fee;
  }

  const procedures = Object.entries(procedureMap)
    .map(([code, data]) => ({ code, ...data }))
    .sort((a, b) => b.count - a.count);

  res.json(procedures);
});

// Aging report
router.get('/aging', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const now = new Date();

  const invoices = await prisma.invoice.findMany({
    where: {
      patient: { practiceId },
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      payments: true,
    },
  });

  const aging = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, overNinety: 0 };
  const details: unknown[] = [];

  for (const inv of invoices) {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    const balance = inv.total - paid;
    const daysPast = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysPast <= 0) aging.current += balance;
    else if (daysPast <= 30) aging.thirtyDays += balance;
    else if (daysPast <= 60) aging.sixtyDays += balance;
    else if (daysPast <= 90) aging.ninetyDays += balance;
    else aging.overNinety += balance;

    details.push({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patient: inv.patient,
      total: inv.total,
      paid,
      balance,
      dueDate: inv.dueDate,
      daysPastDue: Math.max(0, daysPast),
    });
  }

  res.json({ aging, details });
});

export default router;
