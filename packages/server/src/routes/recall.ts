import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const recallTypeEnum = z.enum([
  'PROPHYLAXIS', 'PERIO_MAINTENANCE', 'EXAM', 'XRAYS',
  'FLUORIDE', 'SEALANT_CHECK', 'ORTHO_CHECK', 'CUSTOM',
]);

const recallStatusEnum = z.enum([
  'DUE', 'SCHEDULED', 'OVERDUE', 'COMPLETED', 'SKIPPED',
]);

const reminderMethodEnum = z.enum(['EMAIL', 'SMS', 'PHONE', 'MAIL']);

const createRecallSchema = z.object({
  patientId: z.string(),
  type: recallTypeEnum,
  intervalMonths: z.number().min(1).max(60).optional(),
  nextDue: z.string().transform((s) => new Date(s)),
  priority: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

const updateRecallSchema = z.object({
  type: recallTypeEnum.optional(),
  intervalMonths: z.number().min(1).max(60).optional(),
  nextDue: z.string().transform((s) => new Date(s)).optional(),
  status: recallStatusEnum.optional(),
  priority: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

const createReminderSchema = z.object({
  method: reminderMethodEnum,
  status: z.string().optional(),
  response: z.string().optional(),
});

// List all recalls with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const status = req.query.status as string;
  const type = req.query.type as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: Record<string, unknown> = {
    patient: { practiceId: req.auth!.practiceId },
  };

  if (status) where.status = status;
  if (type) where.type = type;
  if (startDate || endDate) {
    const nextDueFilter: Record<string, Date> = {};
    if (startDate) nextDueFilter.gte = new Date(startDate);
    if (endDate) nextDueFilter.lte = new Date(endDate);
    where.nextDue = nextDueFilter;
  }

  const [recalls, total] = await Promise.all([
    prisma.recallSchedule.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nextDue: 'asc' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        reminders: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    }),
    prisma.recallSchedule.count({ where: where as any }),
  ]);

  res.json({
    recalls,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Get recall statistics
router.get('/stats', async (req: Request, res: Response) => {
  const practiceFilter = { patient: { practiceId: req.auth!.practiceId } } as any;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [totalDue, overdueCount, completedThisMonth, totalThisMonth] = await Promise.all([
    prisma.recallSchedule.count({
      where: { ...practiceFilter, status: 'DUE' },
    }),
    prisma.recallSchedule.count({
      where: {
        ...practiceFilter,
        status: 'DUE',
        nextDue: { lt: now },
      },
    }),
    prisma.recallSchedule.count({
      where: {
        ...practiceFilter,
        status: 'COMPLETED',
        lastCompleted: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.recallSchedule.count({
      where: {
        ...practiceFilter,
        nextDue: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ]);

  const completionRate = totalThisMonth > 0
    ? Math.round((completedThisMonth / totalThisMonth) * 100)
    : 0;

  res.json({
    totalDue,
    overdueCount,
    completedThisMonth,
    totalThisMonth,
    completionRate,
  });
});

// Get overdue recalls
router.get('/overdue', async (req: Request, res: Response) => {
  const now = new Date();

  const recalls = await prisma.recallSchedule.findMany({
    where: {
      patient: { practiceId: req.auth!.practiceId },
      status: 'DUE',
      nextDue: { lt: now },
    },
    orderBy: { nextDue: 'asc' },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          phoneSecondary: true,
          email: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
        },
      },
      reminders: { orderBy: { sentAt: 'desc' }, take: 1 },
    },
  });

  res.json(recalls);
});

// Get all recalls for a specific patient
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: {
      id: req.params.patientId,
      practiceId: req.auth!.practiceId,
    },
  });

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const recalls = await prisma.recallSchedule.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { nextDue: 'asc' },
    include: {
      reminders: { orderBy: { sentAt: 'desc' } },
    },
  });

  res.json(recalls);
});

// Create a new recall schedule
router.post('/', async (req: Request, res: Response) => {
  const data = createRecallSchema.parse(req.body);

  const patient = await prisma.patient.findFirst({
    where: {
      id: data.patientId,
      practiceId: req.auth!.practiceId,
    },
  });

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const recall = await prisma.recallSchedule.create({
    data: {
      patientId: data.patientId,
      type: data.type,
      intervalMonths: data.intervalMonths ?? 6,
      nextDue: data.nextDue,
      priority: data.priority ?? 1,
      notes: data.notes,
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json(recall);
});

// Update a recall schedule
router.put('/:id', async (req: Request, res: Response) => {
  const data = updateRecallSchema.parse(req.body);

  const existing = await prisma.recallSchedule.findFirst({
    where: {
      id: req.params.id,
      patient: { practiceId: req.auth!.practiceId },
    },
  });

  if (!existing) {
    res.status(404).json({ error: 'Recall not found' });
    return;
  }

  const recall = await prisma.recallSchedule.update({
    where: { id: req.params.id },
    data: data as any,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      reminders: { orderBy: { sentAt: 'desc' }, take: 1 },
    },
  });

  res.json(recall);
});

// Mark a recall as completed and auto-create the next recall
router.put('/:id/complete', async (req: Request, res: Response) => {
  const existing = await prisma.recallSchedule.findFirst({
    where: {
      id: req.params.id,
      patient: { practiceId: req.auth!.practiceId },
    },
  });

  if (!existing) {
    res.status(404).json({ error: 'Recall not found' });
    return;
  }

  const now = new Date();
  const nextDue = new Date(now);
  nextDue.setMonth(nextDue.getMonth() + existing.intervalMonths);

  const [completedRecall, nextRecall] = await prisma.$transaction([
    prisma.recallSchedule.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        lastCompleted: now,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.recallSchedule.create({
      data: {
        patientId: existing.patientId,
        type: existing.type,
        intervalMonths: existing.intervalMonths,
        nextDue,
        priority: existing.priority,
        notes: existing.notes,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  res.json({ completedRecall, nextRecall });
});

// Log a reminder sent for a recall
router.post('/:id/remind', async (req: Request, res: Response) => {
  const data = createReminderSchema.parse(req.body);

  const existing = await prisma.recallSchedule.findFirst({
    where: {
      id: req.params.id,
      patient: { practiceId: req.auth!.practiceId },
    },
  });

  if (!existing) {
    res.status(404).json({ error: 'Recall not found' });
    return;
  }

  const reminder = await prisma.recallReminder.create({
    data: {
      recallId: req.params.id,
      method: data.method,
      status: data.status ?? 'sent',
      response: data.response,
    },
  });

  res.status(201).json(reminder);
});

export default router;
