import { prisma } from '../config/database';

export async function generateDailyReport(practiceId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [appointments, treatments, payments] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        provider: { practiceId },
        startTime: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    prisma.treatment.findMany({
      where: {
        provider: { practiceId },
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { cdtCode: true, description: true, fee: true, providerId: true },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        invoice: { patient: { practiceId } },
        date: { gte: dayStart, lte: dayEnd },
      },
    }),
  ]);

  const totalProduction = treatments.reduce((sum, t) => sum + t.fee, 0);
  const totalCollections = payments._sum.amount || 0;

  const statusBreakdown: Record<string, number> = {};
  for (const apt of appointments) {
    statusBreakdown[apt.status] = (statusBreakdown[apt.status] || 0) + 1;
  }

  const procedureSummary: Record<string, { count: number; revenue: number }> = {};
  for (const t of treatments) {
    if (!procedureSummary[t.cdtCode]) {
      procedureSummary[t.cdtCode] = { count: 0, revenue: 0 };
    }
    procedureSummary[t.cdtCode].count++;
    procedureSummary[t.cdtCode].revenue += t.fee;
  }

  return {
    date: dayStart.toISOString().split('T')[0],
    appointments: {
      total: appointments.length,
      statusBreakdown,
      list: appointments.map((apt) => ({
        id: apt.id,
        time: apt.startTime,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
        provider: apt.provider.name,
        type: apt.type,
        status: apt.status,
      })),
    },
    production: {
      total: Math.round(totalProduction * 100) / 100,
      procedureSummary,
    },
    collections: Math.round(totalCollections * 100) / 100,
  };
}

export async function generateMonthlyReport(practiceId: string, year: number, month: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const [
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    noShows,
    newPatients,
    treatmentRevenue,
    paymentsReceived,
    claimsSummary,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: monthStart, lte: monthEnd },
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: monthStart, lte: monthEnd },
        status: 'CANCELLED',
      },
    }),
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: monthStart, lte: monthEnd },
        status: 'NO_SHOW',
      },
    }),
    prisma.patient.count({
      where: {
        practiceId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.treatment.aggregate({
      _sum: { fee: true },
      where: {
        provider: { practiceId },
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        invoice: { patient: { practiceId } },
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.insuranceClaim.findMany({
      where: {
        invoice: { patient: { practiceId } },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { status: true, amountClaimed: true, amountPaid: true },
    }),
  ]);

  const totalClaimed = claimsSummary.reduce((s, c) => s + c.amountClaimed, 0);
  const totalClaimPaid = claimsSummary.reduce((s, c) => s + (c.amountPaid || 0), 0);

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    appointments: {
      total: totalAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      noShows,
      completionRate: totalAppointments > 0
        ? Math.round((completedAppointments / totalAppointments) * 100)
        : 0,
    },
    patients: {
      newPatients,
    },
    financial: {
      production: Math.round((treatmentRevenue._sum.fee || 0) * 100) / 100,
      collections: Math.round((paymentsReceived._sum.amount || 0) * 100) / 100,
      insuranceClaimed: Math.round(totalClaimed * 100) / 100,
      insuranceReceived: Math.round(totalClaimPaid * 100) / 100,
    },
  };
}

export async function generatePatientStatement(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      phone: true,
      email: true,
    },
  });

  if (!patient) {
    return null;
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      patientId,
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    include: {
      treatments: {
        select: { cdtCode: true, description: true, fee: true, date: true },
      },
      payments: {
        select: { amount: true, date: true, method: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  const statementLines = invoices.map((inv) => {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    return {
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      dueDate: inv.dueDate,
      treatments: inv.treatments.map((t) => ({
        code: t.cdtCode,
        description: t.description,
        fee: t.fee,
        date: t.date,
      })),
      total: inv.total,
      insurancePortion: inv.insurancePortion,
      patientPortion: inv.patientPortion,
      paid: Math.round(paid * 100) / 100,
      balance: Math.round((inv.patientPortion - paid) * 100) / 100,
    };
  });

  const totalBalance = statementLines.reduce((s, l) => s + l.balance, 0);

  return {
    patient,
    statementDate: new Date().toISOString().split('T')[0],
    lines: statementLines,
    totalBalance: Math.round(totalBalance * 100) / 100,
  };
}
