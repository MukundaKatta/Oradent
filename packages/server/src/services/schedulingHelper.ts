import { prisma } from '../config/database';
import { addDays } from 'date-fns';

interface AvailableSlot {
  start: Date;
  end: Date;
  chairId?: string;
  chairName?: string;
}

export async function getAvailableSlots(
  practiceId: string,
  providerId: string,
  date: Date,
  duration: number
): Promise<AvailableSlot[]> {
  const settings = await prisma.practiceSettings.findFirst({
    where: { practiceId },
  });

  if (!settings) return [];

  const [startHour, startMin] = settings.workingHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.workingHoursEnd.split(':').map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(startHour, startMin, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMin, 0, 0);

  // Check if this day is a working day
  const dayOfWeek = date.getDay();
  if (!settings.workingDays.includes(dayOfWeek)) {
    return [];
  }

  // Get existing appointments for the provider on this day
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      providerId,
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    },
    select: { startTime: true, endTime: true, chairId: true },
    orderBy: { startTime: 'asc' },
  });

  const chairs = await prisma.chair.findMany({
    where: { practiceId, isActive: true },
  });

  const slots: AvailableSlot[] = [];
  const slotIncrement = settings.appointmentDuration;
  let current = new Date(dayStart);

  while (current.getTime() + duration * 60 * 1000 <= dayEnd.getTime()) {
    const slotEnd = new Date(current.getTime() + duration * 60 * 1000);

    // Check provider availability
    const providerBusy = existingAppointments.some(
      (apt) =>
        apt.startTime.getTime() < slotEnd.getTime() &&
        apt.endTime.getTime() > current.getTime()
    );

    if (!providerBusy) {
      // Find an available chair
      for (const chair of chairs) {
        const chairBusy = existingAppointments.some(
          (apt) =>
            apt.chairId === chair.id &&
            apt.startTime.getTime() < slotEnd.getTime() &&
            apt.endTime.getTime() > current.getTime()
        );

        if (!chairBusy) {
          slots.push({
            start: new Date(current),
            end: new Date(slotEnd),
            chairId: chair.id,
            chairName: chair.name,
          });
          break; // Only need one available chair per time slot
        }
      }
    }

    current = new Date(current.getTime() + slotIncrement * 60 * 1000);
  }

  return slots;
}

export async function checkConflict(
  providerId: string,
  chairId: string | null,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<{ hasConflict: boolean; reason?: string }> {
  const conditions: unknown[] = [
    {
      providerId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  ];

  if (chairId) {
    conditions.push({
      chairId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    });
  }

  const where: Record<string, unknown> = {
    status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    OR: conditions,
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const conflict = await prisma.appointment.findFirst({
    where: where as any,
    include: {
      provider: { select: { name: true } },
      chair: { select: { name: true } },
    },
  });

  if (conflict) {
    const reason =
      conflict.providerId === providerId
        ? `Provider ${conflict.provider.name} has a conflicting appointment`
        : `Chair ${conflict.chair?.name || 'unknown'} is occupied`;
    return { hasConflict: true, reason };
  }

  return { hasConflict: false };
}

export async function getNextAvailableSlot(
  providerId: string,
  preferredDate: Date,
  duration: number
): Promise<AvailableSlot | null> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { practiceId: true },
  });

  if (!provider) return null;

  // Search up to 30 days ahead
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = addDays(preferredDate, dayOffset);
    const slots = await getAvailableSlots(provider.practiceId, providerId, date, duration);
    if (slots.length > 0) {
      return slots[0];
    }
  }

  return null;
}
