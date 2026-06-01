import { prisma } from '../config/database';

export async function getPatientGrowthTrend(practiceId: string, months: number = 12) {
  const now = new Date();
  const results: Array<{ month: string; count: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await prisma.patient.count({
      where: {
        practiceId,
        createdAt: { gte: start, lt: end },
      },
    });
    results.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      count,
    });
  }

  return results;
}

export async function getAppointmentCompletionRate(
  practiceId: string,
  startDate: Date,
  endDate: Date
) {
  const [completed, total] = await Promise.all([
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    }),
    prisma.appointment.count({
      where: {
        provider: { practiceId },
        startTime: { gte: startDate, lte: endDate },
        status: { notIn: ['CANCELLED', 'RESCHEDULED'] },
      },
    }),
  ]);

  return {
    completed,
    total,
    rate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export async function getRevenueByProvider(
  practiceId: string,
  startDate: Date,
  endDate: Date
) {
  const providers = await prisma.provider.findMany({
    where: { practiceId, isActive: true },
    select: { id: true, name: true, role: true },
  });

  const results = await Promise.all(
    providers.map(async (provider) => {
      const revenue = await prisma.treatment.aggregate({
        _sum: { fee: true },
        where: {
          providerId: provider.id,
          date: { gte: startDate, lte: endDate },
        },
      });
      return {
        providerId: provider.id,
        providerName: provider.name,
        role: provider.role,
        revenue: Math.round((revenue._sum.fee || 0) * 100) / 100,
      };
    })
  );

  return results.sort((a, b) => b.revenue - a.revenue);
}

export async function getTopProcedures(practiceId: string, limit: number = 10) {
  const treatments = await prisma.treatment.findMany({
    where: { provider: { practiceId } },
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

  return Object.entries(procedureMap)
    .map(([code, data]) => ({
      code,
      description: data.description,
      count: data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getPatientDemographics(practiceId: string) {
  const patients = await prisma.patient.findMany({
    where: { practiceId, status: 'ACTIVE' },
    select: { dateOfBirth: true, gender: true },
  });

  const now = new Date();
  const ageGroups: Record<string, number> = {
    '0-17': 0,
    '18-34': 0,
    '35-54': 0,
    '55-74': 0,
    '75+': 0,
  };

  const genderDistribution: Record<string, number> = {};

  for (const patient of patients) {
    // Age group
    const age = Math.floor(
      (now.getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (age < 18) ageGroups['0-17']++;
    else if (age < 35) ageGroups['18-34']++;
    else if (age < 55) ageGroups['35-54']++;
    else if (age < 75) ageGroups['55-74']++;
    else ageGroups['75+']++;

    // Gender distribution
    const gender = patient.gender || 'Unknown';
    genderDistribution[gender] = (genderDistribution[gender] || 0) + 1;
  }

  return {
    totalActive: patients.length,
    ageGroups,
    genderDistribution,
  };
}
