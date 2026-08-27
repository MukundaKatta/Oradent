import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { generateTreatmentPlanPDF } from '../services/pdfGenerator';
import { calculateTreatmentPlanEstimate } from '../services/billingCalc';
import path from 'path';
import { uploadDir } from '../config/storage';

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
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

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

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
    include: { insurancePrimary: true },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  // insurancePays/patientPays are computed server-side from the patient's
  // actual coverage (CDT category, deductible, remaining benefit) instead
  // of trusting whatever the client sent for those fields — a treatment
  // plan is a billing estimate shown to the patient, so it needs to reflect
  // real coverage rules, not client-supplied numbers.
  const estimate = calculateTreatmentPlanEstimate(
    data.items.map((item) => ({ cdtCode: item.cdtCode, fee: item.fee })),
    patient.insurancePrimary
  );

  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: data.patientId,
      name: data.name,
      notes: data.notes,
      aiGenerated: data.aiGenerated || false,
      totalFee: estimate.totalFee,
      insuranceEst: estimate.insuranceEst,
      patientEst: estimate.patientEst,
      items: {
        create: data.items.map((item, idx) => ({
          ...item,
          surfaces: item.surfaces || [],
          insurancePays: estimate.breakdown[idx].insurancePays,
          patientPays: estimate.breakdown[idx].patientPays,
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

  const existing = await prisma.treatmentPlan.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Treatment plan not found' });
    return;
  }

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

// Generate treatment plan PDF
router.get('/plans/:id/pdf', async (req: Request, res: Response) => {
  const plan = await prisma.treatmentPlan.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      patient: {
        include: { insurancePrimary: { select: { company: true, memberId: true, planName: true } } },
      },
    },
  });

  if (!plan) {
    res.status(404).json({ error: 'Treatment plan not found' });
    return;
  }

  const practice = await prisma.practice.findUnique({ where: { id: req.auth!.practiceId } });
  if (!practice) {
    res.status(404).json({ error: 'Practice not found' });
    return;
  }

  const outputPath = path.join(uploadDir, 'pdfs', `treatment-plan-${plan.id}.pdf`);
  await generateTreatmentPlanPDF({
    practice: { name: practice.name, address: practice.address, phone: practice.phone, email: practice.email, npi: practice.npi },
    patient: { firstName: plan.patient.firstName, lastName: plan.patient.lastName, dateOfBirth: plan.patient.dateOfBirth, phone: plan.patient.phone },
    plan: {
      name: plan.name,
      createdAt: plan.createdAt,
      items: plan.items,
      totalFee: plan.totalFee,
      insuranceEst: plan.insuranceEst,
      patientEst: plan.patientEst,
      notes: plan.notes,
    },
    insurance: plan.patient.insurancePrimary,
  }, outputPath);

  res.download(outputPath, `treatment-plan-${plan.name.replace(/\s+/g, '-')}.pdf`);
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
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

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

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

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
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

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

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const note = await prisma.clinicalNote.create({
    data: {
      ...data,
      vitals: data.vitals as any,
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
  const existing = await prisma.clinicalNote.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Clinical note not found' });
    return;
  }
  if (existing.signedAt) {
    res.status(409).json({ error: 'Note has already been signed' });
    return;
  }

  const note = await prisma.clinicalNote.update({
    where: { id: req.params.id },
    data: { signedAt: new Date(), signedById: req.auth!.providerId },
  });

  res.json(note);
});

export default router;
