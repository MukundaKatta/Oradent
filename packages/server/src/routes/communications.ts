import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const createCommunicationSchema = z.object({
  patientId: z.string(),
  providerId: z.string().optional(),
  type: z.enum(['EMAIL', 'SMS', 'PHONE_CALL', 'IN_APP', 'LETTER', 'FAX']),
  direction: z.enum(['OUTBOUND', 'INBOUND']),
  subject: z.string().optional(),
  body: z.string().min(1),
  status: z.enum(['DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateCommunicationSchema = z.object({
  subject: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BOUNCED']).optional(),
  metadata: z.record(z.unknown()).optional(),
  readAt: z.string().transform((s) => new Date(s)).optional(),
});

const bulkSendSchema = z.object({
  patientIds: z.array(z.string()).min(1),
  type: z.enum(['EMAIL', 'SMS', 'PHONE_CALL', 'IN_APP', 'LETTER', 'FAX']),
  subject: z.string().optional(),
  body: z.string().min(1),
});

// List all communications with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const type = req.query.type as string;
  const direction = req.query.direction as string;
  const status = req.query.status as string;
  const patientId = req.query.patientId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: Record<string, unknown> = {
    patient: { practiceId: req.auth!.practiceId },
  };

  if (type) where.type = type;
  if (direction) where.direction = direction;
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;

  if (startDate || endDate) {
    const createdAt: Record<string, unknown> = {};
    if (startDate) createdAt.gte = new Date(startDate);
    if (endDate) createdAt.lte = new Date(endDate);
    where.createdAt = createdAt;
  }

  const [communications, total] = await Promise.all([
    prisma.communication.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        provider: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.communication.count({ where: where as any }),
  ]);

  res.json({
    communications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Communication stats
router.get('/stats', async (req: Request, res: Response) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseWhere = {
    patient: { practiceId: req.auth!.practiceId },
    createdAt: { gte: startOfMonth },
  };

  const [totalThisMonth, byType, outbound, inboundResponses] = await Promise.all([
    prisma.communication.count({ where: baseWhere as any }),
    prisma.communication.groupBy({
      by: ['type'],
      where: baseWhere as any,
      _count: { id: true },
    }),
    prisma.communication.count({
      where: { ...baseWhere, direction: 'OUTBOUND' } as any,
    }),
    prisma.communication.count({
      where: { ...baseWhere, direction: 'INBOUND' } as any,
    }),
  ]);

  const typeBreakdown: Record<string, number> = {};
  for (const entry of byType) {
    typeBreakdown[entry.type] = entry._count.id;
  }

  const responseRate = outbound > 0 ? Math.round((inboundResponses / outbound) * 100) : 0;

  res.json({
    totalThisMonth,
    byType: typeBreakdown,
    outbound,
    inbound: inboundResponses,
    responseRate,
  });
});

// Get communication history for a patient
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const where: Record<string, unknown> = {
    patientId: req.params.patientId,
    patient: { practiceId: req.auth!.practiceId },
  };

  const [communications, total] = await Promise.all([
    prisma.communication.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.communication.count({ where: where as any }),
  ]);

  res.json({
    communications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Log a new communication
router.post('/', async (req: Request, res: Response) => {
  const data = createCommunicationSchema.parse(req.body);

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const communication = await prisma.communication.create({
    data: {
      ...data,
      metadata: data.metadata as any,
      status: data.status || 'SENT',
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(communication);
});

// Update communication
router.put('/:id', async (req: Request, res: Response) => {
  const data = updateCommunicationSchema.parse(req.body);

  const existing = await prisma.communication.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Communication not found' });
    return;
  }

  const updateData: Record<string, unknown> = { ...data };

  if (data.status === 'READ' && !data.readAt && !existing.readAt) {
    updateData.readAt = new Date();
  }

  const communication = await prisma.communication.update({
    where: { id: req.params.id },
    data: updateData as any,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, name: true } },
    },
  });

  res.json(communication);
});

// Bulk send messages to multiple patients
router.post('/bulk-send', async (req: Request, res: Response) => {
  const data = bulkSendSchema.parse(req.body);

  const patients = await prisma.patient.findMany({
    where: {
      id: { in: data.patientIds },
      practiceId: req.auth!.practiceId,
    },
    select: { id: true },
  });

  const validPatientIds = patients.map((p) => p.id);

  if (validPatientIds.length === 0) {
    res.status(404).json({ error: 'No valid patients found' });
    return;
  }

  const communications = await prisma.communication.createMany({
    data: validPatientIds.map((patientId) => ({
      patientId,
      type: data.type,
      direction: 'OUTBOUND' as const,
      subject: data.subject,
      body: data.body,
      status: 'SENT' as const,
    })),
  });

  res.status(201).json({
    sent: communications.count,
    total: data.patientIds.length,
    skipped: data.patientIds.length - validPatientIds.length,
  });
});

export default router;
