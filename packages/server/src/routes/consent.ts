import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Consent Template schemas
const templateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  content: z.string().min(1),
  isActive: z.boolean().optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// Patient Consent schemas
const patientConsentSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  templateName: z.string(),
  templateVersion: z.number().optional(),
  content: z.string().min(1),
  procedureDescription: z.string().optional(),
  toothNumbers: z.array(z.number().min(1).max(32)).optional(),
});

const signConsentSchema = z.object({
  signatureData: z.string().min(1),
  witnessName: z.string().optional(),
});

const revokeConsentSchema = z.object({
  revokedReason: z.string().optional(),
});

// ---- Templates ----

// List consent templates for the practice
router.get('/templates', async (req: Request, res: Response) => {
  const templates = await prisma.consentTemplate.findMany({
    where: { practiceId: req.auth!.practiceId },
    orderBy: { updatedAt: 'desc' },
  });

  res.json(templates);
});

// Create a consent template
router.post('/templates', async (req: Request, res: Response) => {
  const data = templateSchema.parse(req.body);

  const template = await prisma.consentTemplate.create({
    data: {
      ...data,
      practiceId: req.auth!.practiceId,
    },
  });

  res.status(201).json(template);
});

// Update a consent template (bump version)
router.put('/templates/:id', async (req: Request, res: Response) => {
  const data = updateTemplateSchema.parse(req.body);

  const existing = await prisma.consentTemplate.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const template = await prisma.consentTemplate.update({
    where: { id: req.params.id },
    data: {
      ...data,
      version: existing.version + 1,
    },
  });

  res.json(template);
});

// ---- Patient Consents ----

// Get consent stats
router.get('/stats', async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pendingCount, signedToday, totalActive] = await Promise.all([
    prisma.patientConsent.count({
      where: {
        patient: { practiceId: req.auth!.practiceId },
        status: 'PENDING',
      },
    }),
    prisma.patientConsent.count({
      where: {
        patient: { practiceId: req.auth!.practiceId },
        status: 'SIGNED',
        signedAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.patientConsent.count({
      where: {
        patient: { practiceId: req.auth!.practiceId },
        status: { in: ['PENDING', 'SIGNED'] },
      },
    }),
  ]);

  res.json({ pendingCount, signedToday, totalActive });
});

// List consents for a patient (with optional status filter)
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const where: Record<string, unknown> = { patientId: req.params.patientId };
  const status = req.query.status as string;
  if (status) where.status = status;

  const consents = await prisma.patientConsent.findMany({
    where: where as any,
    include: {
      provider: { select: { id: true, name: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(consents);
});

// Create a consent form for a patient (from template or custom)
router.post('/', async (req: Request, res: Response) => {
  const data = patientConsentSchema.parse(req.body);

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const consent = await prisma.patientConsent.create({
    data: {
      patientId: data.patientId,
      providerId: data.providerId,
      templateName: data.templateName,
      templateVersion: data.templateVersion || 1,
      content: data.content,
      procedureDescription: data.procedureDescription,
      toothNumbers: data.toothNumbers || [],
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, name: true, title: true } },
    },
  });

  res.status(201).json(consent);
});

// Sign a consent
router.put('/:id/sign', async (req: Request, res: Response) => {
  const data = signConsentSchema.parse(req.body);

  const existing = await prisma.patientConsent.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Consent not found' });
    return;
  }

  const consent = await prisma.patientConsent.update({
    where: { id: req.params.id },
    data: {
      signatureData: data.signatureData,
      signedAt: new Date(),
      witnessName: data.witnessName,
      status: 'SIGNED',
    },
  });

  res.json(consent);
});

// Revoke a consent
router.put('/:id/revoke', async (req: Request, res: Response) => {
  const data = revokeConsentSchema.parse(req.body);

  const existing = await prisma.patientConsent.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Consent not found' });
    return;
  }

  const consent = await prisma.patientConsent.update({
    where: { id: req.params.id },
    data: {
      revokedAt: new Date(),
      revokedReason: data.revokedReason,
      status: 'REVOKED',
    },
  });

  res.json(consent);
});

// Get a single consent with full details
router.get('/:id', async (req: Request, res: Response) => {
  const consent = await prisma.patientConsent.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
    include: {
      patient: true,
      provider: { select: { id: true, name: true, title: true } },
    },
  });

  if (!consent) {
    res.status(404).json({ error: 'Consent not found' });
    return;
  }

  res.json(consent);
});

export default router;
