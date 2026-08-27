import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const APPLIANCE_TYPES = ['FIXED_METAL', 'FIXED_CERAMIC', 'LINGUAL', 'ALIGNER', 'RETAINER'] as const;
const CASE_STATUSES = ['ACTIVE', 'RETENTION', 'COMPLETED', 'DISCONTINUED'] as const;

// Closed transition table (ORTHO-09). Anything not listed here is invalid,
// including staying in place or moving backward (e.g. COMPLETED -> ACTIVE).
const VALID_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  ACTIVE: ['RETENTION', 'COMPLETED', 'DISCONTINUED'],
  RETENTION: ['COMPLETED'],
  COMPLETED: [],
  DISCONTINUED: [],
};

const createCaseSchema = z
  .object({
    patientId: z.string(),
    applianceType: z.enum(APPLIANCE_TYPES),
    startDate: z.string().transform((s) => new Date(s)),
    estimatedEndDate: z.string().transform((s) => new Date(s)).optional(),
    totalAlignerSteps: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => !data.estimatedEndDate || data.estimatedEndDate >= data.startDate,
    { message: 'estimatedEndDate must not be before startDate', path: ['estimatedEndDate'] }
  );

// Create an orthodontic case (ORTHO-01, ORTHO-02, ORTHO-03)
router.post('/cases', async (req: Request, res: Response) => {
  const data = createCaseSchema.parse(req.body);

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const activeCase = await prisma.orthodonticCase.findFirst({
    where: { patientId: data.patientId, status: 'ACTIVE' },
  });
  if (activeCase) {
    res.status(409).json({
      error: `Patient already has an active orthodontic case (${activeCase.id})`,
      activeCaseId: activeCase.id,
    });
    return;
  }

  const created = await prisma.orthodonticCase.create({
    data: {
      patientId: data.patientId,
      providerId: req.auth!.providerId,
      applianceType: data.applianceType,
      startDate: data.startDate,
      estimatedEndDate: data.estimatedEndDate,
      totalAlignerSteps: data.totalAlignerSteps,
      notes: data.notes,
    },
  });

  res.status(201).json(created);
});

// List a patient's orthodontic cases, active and historical (ORTHO-06)
router.get('/cases/:patientId', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const cases = await prisma.orthodonticCase.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { startDate: 'desc' },
  });

  res.json(cases);
});

const patchCaseSchema = z.object({
  status: z.enum(CASE_STATUSES),
});

// Transition a case's status (ORTHO-09)
router.patch('/cases/:caseId', async (req: Request, res: Response) => {
  const { status } = patchCaseSchema.parse(req.body);

  const existing = await prisma.orthodonticCase.findFirst({
    where: { id: req.params.caseId, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Orthodontic case not found' });
    return;
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[existing.status] || [];
  if (!allowedTransitions.includes(status)) {
    res.status(400).json({ error: `Invalid status transition from ${existing.status} to ${status}` });
    return;
  }

  const updated = await prisma.orthodonticCase.update({
    where: { id: req.params.caseId },
    data: { status },
  });

  res.json(updated);
});

export default router;
