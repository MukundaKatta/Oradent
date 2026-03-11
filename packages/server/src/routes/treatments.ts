import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Treatment Plans
const treatmentPlanSchema = z.object({
  patientId: z.string(),
  name: z.string().min(1),
  notes: z.string().optional(),
  aiGenerated: z.boolean().optional(),
  items: z.array(z.object({
    toothNumber: z.number().min(1).max(32).optional(),
    surfaces: z.array(z.string()).optional(),
    cdtCode: z.string(),
    description: z.string(),
    fee: z.number().min(0),
    insurancePays: z.number().min(0).optional(),
    patientPays: z.number().min(0).optional(),
    priority: z.number().min(1).max(3).optional(),
    sortOrder: z.number().optional(),
  })),
});

// List treatment plans for a patient
router.get('/plans/:patientId', async (req: Request, res: Response) => {
  const plans = await prisma.treatmentPlan.findMany({
    where: { patientId: req.params.patientId },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(plans);
});

// Create treatment plan
router.post('/plans', async (req: Request, res: Response) => {
  const data = treatmentPlanSchema.parse(req.body);

  const totalFee = data.items.reduce((sum, item) => sum + item.fee, 0);
  const insuranceEst = data.items.reduce((sum, item) => sum + (item.insurancePays || 0), 0);
  const patientEst = totalFee - insuranceEst;

  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: data.patientId,
      name: data.name,
      notes: data.notes,
      aiGenerated: data.aiGenerated || false,
      totalFee,
      insuranceEst,
      patientEst,
      items: {
        create: data.items.map((item, idx) => ({
          ...item,
          surfaces: item.surfaces || [],
          insurancePays: item.insurancePays || 0,
          patientPays: item.patientPays || item.fee - (item.insurancePays || 0),
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });

  res.status(201).json(plan);
});

// Update treatment plan status
router.patch('/plans/:id/status', async (req: Request, res: Response) => {
  const { status } = z.object({
    status: z.enum(['PROPOSED', 'PRESENTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED']),
  }).parse(req.body);

  const updateData: Record<string, unknown> = { status };
  if (status === 'PRESENTED') updateData.presentedAt = new Date();
  if (status === 'ACCEPTED') updateData.acceptedAt = new Date();

  const plan = await prisma.treatmentPlan.update({
    where: { id: req.params.id },
    data: updateData as any,
    include: { items: true },
  });

  res.json(plan);
});

// Record completed treatment
const treatmentSchema = z.object({
  patientId: z.string(),
  toothNumber: z.number().min(1).max(32).optional(),
  surfaces: z.array(z.string()).optional(),
  cdtCode: z.string(),
  description: z.string(),
  diagnosisCodes: z.array(z.string()).optional(),
  fee: z.number().min(0),
  notes: z.string().optional(),
  date: z.string().transform((s) => new Date(s)).optional(),
});

// List treatments for a patient
router.get('/:patientId', async (req: Request, res: Response) => {
  const treatments = await prisma.treatment.findMany({
    where: { patientId: req.params.patientId },
    include: {
      provider: { select: { id: true, name: true, title: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json(treatments);
});

// Create treatment record
router.post('/', async (req: Request, res: Response) => {
  const data = treatmentSchema.parse(req.body);

  const treatment = await prisma.treatment.create({
    data: {
      ...data,
      surfaces: data.surfaces || [],
      diagnosisCodes: data.diagnosisCodes || [],
      providerId: req.auth!.providerId,
    },
    include: {
      provider: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(treatment);
});

// Clinical Notes
const noteSchema = z.object({
  patientId: z.string(),
  type: z.string().default('progress'),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  vitals: z.record(z.unknown()).optional(),
  aiAssisted: z.boolean().optional(),
});

// List notes for a patient
router.get('/:patientId/notes', async (req: Request, res: Response) => {
  const notes = await prisma.clinicalNote.findMany({
    where: { patientId: req.params.patientId },
    include: {
      provider: { select: { id: true, name: true, title: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json(notes);
});

// Create clinical note
router.post('/notes', async (req: Request, res: Response) => {
  const data = noteSchema.parse(req.body);

  const note = await prisma.clinicalNote.create({
    data: {
      ...data,
      providerId: req.auth!.providerId,
    },
    include: {
      provider: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(note);
});

// Sign clinical note
router.patch('/notes/:id/sign', async (req: Request, res: Response) => {
  const note = await prisma.clinicalNote.update({
    where: { id: req.params.id },
    data: { signedAt: new Date() },
  });

  res.json(note);
});

export default router;
