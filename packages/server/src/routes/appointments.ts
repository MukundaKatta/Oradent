import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Shared by POST / and PUT /:id so remarking/dragging an existing
// appointment on the calendar (PUT) gets the same race-condition
// protection as creating one — previously only POST checked for overlaps.
async function findAppointmentConflict(
  tx: Prisma.TransactionClient,
  params: {
    practiceId: string;
    providerId: string;
    chairId?: string | null;
    startTime: Date;
    endTime: Date;
    excludeId?: string;
  }
) {
  return tx.appointment.findFirst({
    where: {
      provider: { practiceId: params.practiceId },
      status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      OR: [
        {
          providerId: params.providerId,
          startTime: { lt: params.endTime },
          endTime: { gt: params.startTime },
        },
        ...(params.chairId
          ? [{
              chairId: params.chairId,
              startTime: { lt: params.endTime },
              endTime: { gt: params.startTime },
            }]
          : []),
      ],
    },
  });
}

const router = Router();
router.use(authenticate);

const createAppointmentSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  chairId: z.string().optional(),
  startTime: z.string().transform((s) => new Date(s)),
  duration: z.number().min(15).max(480),
  type: z.enum([
    'EXAM', 'CLEANING', 'FILLING', 'CROWN', 'ROOT_CANAL',
    'EXTRACTION', 'IMPLANT', 'COSMETIC', 'EMERGENCY',
    'CONSULTATION', 'FOLLOW_UP', 'OTHER',
  ]),
  reason: z.string().optional(),
  procedures: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringRule: z.string().optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  status: z.enum([
    'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CHAIR',
    'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED',
  ]).optional(),
});

// List appointments with date range
router.get('/', async (req: Request, res: Response) => {
  const start = req.query.start ? new Date(req.query.start as string) : new Date();
  const end = req.query.end
    ? new Date(req.query.end as string)
    : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const providerId = req.query.providerId as string;
  const chairId = req.query.chairId as string;
  const status = req.query.status as string;

  const where: Record<string, unknown> = {
    provider: { practiceId: req.auth!.practiceId },
    // Overlap, not containment: a previous version required endTime <= end,
    // which dropped an appointment that starts inside the window but runs
    // past it (e.g. 17:00-18:30 in an until-18:00 query).
    startTime: { lt: end },
    endTime: { gt: start },
  };

  if (providerId) where.providerId = providerId;
  if (chairId) where.chairId = chairId;
  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where: where as any,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true, color: true } },
      chair: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  res.json(appointments);
});

// Today's appointments (must be before /:id to avoid matching "today" as an id)
router.get('/today/schedule', async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      provider: { practiceId: req.auth!.practiceId },
      startTime: { gte: today, lt: tomorrow },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true, color: true } },
      chair: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  res.json(appointments);
});

// Check for scheduling conflicts
router.get('/check-conflict', async (req: Request, res: Response) => {
  const date = req.query.date as string;
  const time = req.query.time as string;
  const providerId = req.query.providerId as string;
  const chairId = req.query.chairId as string;
  const excludeId = req.query.excludeId as string;
  const duration = parseInt(req.query.duration as string) || 30;

  if (!date || !time) {
    res.json({ hasConflict: false });
    return;
  }

  // No timezone designator on purpose: the only real caller
  // (AppointmentModal.tsx) builds startTime for POST/PUT the same way,
  // `${date}T${time}:00` with no offset, which Node's Date parses as
  // server-local time — matching that (rather than assuming a proper ISO/UTC
  // string, which is not what's actually sent) keeps this pre-check
  // consistent with what create/update will decide.
  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  const where: Record<string, unknown> = {
    provider: { practiceId: req.auth!.practiceId },
    status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    OR: [
      ...(providerId
        ? [{
            providerId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          }]
        : []),
      ...(chairId
        ? [{
            chairId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          }]
        : []),
    ],
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const conflict = await prisma.appointment.findFirst({
    where: where as any,
    include: {
      provider: { select: { name: true } },
      chair: { select: { name: true } },
    },
  });

  if (conflict) {
    res.json({
      hasConflict: true,
      message: `Conflicts with existing appointment for ${conflict.provider?.name || 'provider'}`,
    });
  } else {
    res.json({ hasConflict: false });
  }
});

// Get single appointment
router.get('/:id', async (req: Request, res: Response) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: req.params.id,
      provider: { practiceId: req.auth!.practiceId },
    },
    include: {
      patient: true,
      provider: { select: { id: true, name: true, color: true, title: true } },
      chair: true,
    },
  });

  if (!appointment) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  res.json(appointment);
});

// Create appointment (with race-condition protection)
router.post('/', async (req: Request, res: Response) => {
  const data = createAppointmentSchema.parse(req.body);
  const endTime = new Date(data.startTime.getTime() + data.duration * 60 * 1000);

  const [patient, provider, chair] = await Promise.all([
    prisma.patient.findFirst({ where: { id: data.patientId, practiceId: req.auth!.practiceId } }),
    prisma.provider.findFirst({ where: { id: data.providerId, practiceId: req.auth!.practiceId } }),
    data.chairId
      ? prisma.chair.findFirst({ where: { id: data.chairId, practiceId: req.auth!.practiceId } })
      : Promise.resolve(true),
  ]);
  if (!patient || !provider || !chair) {
    res.status(404).json({ error: 'Patient, provider, or chair not found' });
    return;
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const conflict = await findAppointmentConflict(tx, {
        practiceId: req.auth!.practiceId,
        providerId: data.providerId,
        chairId: data.chairId,
        startTime: data.startTime,
        endTime,
      });

      if (conflict) {
        throw new ConflictError('Time slot conflicts with existing appointment');
      }

      return tx.appointment.create({
        data: {
          ...data,
          endTime,
          procedures: data.procedures || [],
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, name: true, color: true } },
          chair: { select: { id: true, name: true } },
        },
      });
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

// Update appointment
router.put('/:id', async (req: Request, res: Response) => {
  const data = updateAppointmentSchema.parse(req.body);

  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, provider: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  const [patient, provider, chair] = await Promise.all([
    data.patientId
      ? prisma.patient.findFirst({ where: { id: data.patientId, practiceId: req.auth!.practiceId } })
      : Promise.resolve(true),
    data.providerId
      ? prisma.provider.findFirst({ where: { id: data.providerId, practiceId: req.auth!.practiceId } })
      : Promise.resolve(true),
    data.chairId
      ? prisma.chair.findFirst({ where: { id: data.chairId, practiceId: req.auth!.practiceId } })
      : Promise.resolve(true),
  ]);
  if (!patient || !provider || !chair) {
    res.status(404).json({ error: 'Patient, provider, or chair not found' });
    return;
  }

  const updateData: Record<string, unknown> = { ...data };

  const effectiveStart = data.startTime ?? existing.startTime;
  if (data.startTime && data.duration) {
    updateData.endTime = new Date(data.startTime.getTime() + data.duration * 60 * 1000);
  } else if (data.startTime) {
    updateData.endTime = new Date(data.startTime.getTime() + existing.duration * 60 * 1000);
  } else if (data.duration) {
    updateData.endTime = new Date(existing.startTime.getTime() + data.duration * 60 * 1000);
  }
  const effectiveEnd = (updateData.endTime as Date | undefined) ?? existing.endTime;

  // Status-specific timestamps
  if (data.status === 'CONFIRMED') updateData.confirmedAt = new Date();
  if (data.status === 'CHECKED_IN') updateData.checkedInAt = new Date();
  if (data.status === 'IN_CHAIR') updateData.seatedAt = new Date();
  if (data.status === 'COMPLETED') updateData.completedAt = new Date();

  const scheduleChanged = data.startTime !== undefined || data.duration !== undefined
    || data.providerId !== undefined || data.chairId !== undefined;

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      if (scheduleChanged) {
        const conflict = await findAppointmentConflict(tx, {
          practiceId: req.auth!.practiceId,
          providerId: data.providerId ?? existing.providerId,
          chairId: data.chairId !== undefined ? data.chairId : existing.chairId,
          startTime: effectiveStart,
          endTime: effectiveEnd,
          excludeId: existing.id,
        });
        if (conflict) {
          throw new ConflictError('Time slot conflicts with existing appointment');
        }
      }

      return tx.appointment.update({
        where: { id: req.params.id },
        data: updateData as any,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, name: true, color: true } },
          chair: { select: { id: true, name: true } },
        },
      });
    });

    res.json(appointment);
  } catch (error) {
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

// Delete appointment
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, provider: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  await prisma.appointment.delete({ where: { id: req.params.id } });
  res.json({ message: 'Appointment deleted' });
});

export default router;
