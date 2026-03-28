import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const appointmentTypeEnum = z.enum([
  'EXAM', 'CLEANING', 'FILLING', 'CROWN', 'ROOT_CANAL',
  'EXTRACTION', 'IMPLANT', 'COSMETIC', 'EMERGENCY',
  'CONSULTATION', 'FOLLOW_UP', 'OTHER',
]);

const createWaitlistSchema = z.object({
  patientId: z.string(),
  providerId: z.string().optional(),
  appointmentType: appointmentTypeEnum,
  preferredDays: z.array(z.number().min(0).max(6)).optional(),
  preferredTimeStart: z.string().optional(),
  preferredTimeEnd: z.string().optional(),
  urgency: z.enum(['ROUTINE', 'SOON', 'URGENT']).optional(),
  notes: z.string().optional(),
});

const updateWaitlistSchema = createWaitlistSchema.partial().extend({
  status: z.enum(['WAITING', 'NOTIFIED', 'SCHEDULED', 'EXPIRED', 'CANCELLED']).optional(),
});

// Stats (must be before /:id to avoid matching "stats" as an id)
router.get('/stats', async (req: Request, res: Response) => {
  const where: Record<string, unknown> = {
    patient: { practiceId: req.auth!.practiceId },
    status: 'WAITING',
  };

  const [totalWaiting, byUrgency, waitingEntries] = await Promise.all([
    prisma.waitlistEntry.count({ where: where as any }),
    prisma.waitlistEntry.groupBy({
      by: ['urgency'],
      where: where as any,
      _count: true,
    }),
    prisma.waitlistEntry.findMany({
      where: where as any,
      select: { createdAt: true },
    }),
  ]);

  const now = new Date();
  const avgWaitTime = waitingEntries.length > 0
    ? waitingEntries.reduce((sum, entry) => sum + (now.getTime() - entry.createdAt.getTime()), 0) / waitingEntries.length
    : 0;

  const urgencyMap: Record<string, number> = {};
  for (const group of byUrgency) {
    urgencyMap[group.urgency] = group._count;
  }

  res.json({
    totalWaiting,
    byUrgency: urgencyMap,
    avgWaitTimeMs: Math.round(avgWaitTime),
    avgWaitTimeDays: Math.round(avgWaitTime / (1000 * 60 * 60 * 24) * 10) / 10,
  });
});

// List waitlist entries with filters and pagination
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const status = req.query.status as string;
  const urgency = req.query.urgency as string;
  const appointmentType = req.query.appointmentType as string;

  const where: Record<string, unknown> = {
    patient: { practiceId: req.auth!.practiceId },
  };

  if (status) where.status = status;
  if (urgency) where.urgency = urgency;
  if (appointmentType) where.appointmentType = appointmentType;

  const [entries, total] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        provider: { select: { id: true, name: true } },
      },
    }),
    prisma.waitlistEntry.count({ where: where as any }),
  ]);

  res.json({
    entries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get waitlist entries for a patient
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      patientId: req.params.patientId,
      patient: { practiceId: req.auth!.practiceId },
    },
    include: {
      provider: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(entries);
});

// Add patient to waitlist
router.post('/', async (req: Request, res: Response) => {
  const data = createWaitlistSchema.parse(req.body);

  const entry = await prisma.waitlistEntry.create({
    data,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(entry);
});

// Update waitlist entry
router.put('/:id', async (req: Request, res: Response) => {
  const data = updateWaitlistSchema.parse(req.body);

  const existing = await prisma.waitlistEntry.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Waitlist entry not found' });
    return;
  }

  const entry = await prisma.waitlistEntry.update({
    where: { id: req.params.id },
    data,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  res.json(entry);
});

// Mark as notified
router.put('/:id/notify', async (req: Request, res: Response) => {
  const existing = await prisma.waitlistEntry.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Waitlist entry not found' });
    return;
  }

  const entry = await prisma.waitlistEntry.update({
    where: { id: req.params.id },
    data: {
      status: 'NOTIFIED',
      notifiedAt: new Date(),
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  res.json(entry);
});

// Mark as scheduled
router.put('/:id/schedule', async (req: Request, res: Response) => {
  const existing = await prisma.waitlistEntry.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Waitlist entry not found' });
    return;
  }

  const entry = await prisma.waitlistEntry.update({
    where: { id: req.params.id },
    data: {
      status: 'SCHEDULED',
      scheduledAt: new Date(),
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  res.json(entry);
});

// Cancel/remove from waitlist
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.waitlistEntry.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Waitlist entry not found' });
    return;
  }

  const entry = await prisma.waitlistEntry.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ message: 'Waitlist entry cancelled' });
});

export default router;
