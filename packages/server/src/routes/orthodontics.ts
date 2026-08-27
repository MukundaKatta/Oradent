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

const createVisitSchema = z
  .object({
    date: z.string().transform((s) => new Date(s)),
    appointmentId: z.string().optional(),
    wireChanged: z.boolean().optional(),
    wireStrength: z.string().optional(),
    elasticsUsed: z.string().optional(),
    alignerStepNumber: z.number().int().positive().optional(),
    notes: z.string().optional(),
    nextVisitDate: z.string().transform((s) => new Date(s)).optional(),
    cdtCode: z.string().optional(),
    fee: z.number().min(0).optional(),
  })
  .refine(
    (data) =>
      data.wireChanged !== undefined ||
      data.elasticsUsed !== undefined ||
      data.alignerStepNumber !== undefined ||
      data.notes !== undefined,
    { message: 'At least one progress field (wireChanged, elasticsUsed, alignerStepNumber, or notes) is required' }
  );

// Create a maintenance visit for a case (ORTHO-04, ORTHO-05)
router.post('/cases/:caseId/visits', async (req: Request, res: Response) => {
  const data = createVisitSchema.parse(req.body);

  const orthoCase = await prisma.orthodonticCase.findFirst({
    where: { id: req.params.caseId, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!orthoCase) {
    res.status(404).json({ error: 'Orthodontic case not found' });
    return;
  }

  if (orthoCase.status !== 'ACTIVE') {
    res.status(409).json({ error: 'Orthodontic case is not active' });
    return;
  }

  if (data.appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: data.appointmentId,
        patientId: orthoCase.patientId,
        provider: { practiceId: req.auth!.practiceId },
      },
    });
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
  }

  if (data.alignerStepNumber !== undefined && orthoCase.applianceType !== 'ALIGNER') {
    res.status(400).json({ error: 'alignerStepNumber is only valid for ALIGNER cases' });
    return;
  }

  if (data.nextVisitDate && data.nextVisitDate < new Date()) {
    res.status(400).json({ error: 'nextVisitDate must not be in the past' });
    return;
  }

  // ORTHO-07 AC2: cdtCode, when present at all, must be an orthodontic
  // (D8xxx) code — checked independently of whether `fee` was also sent.
  if (data.cdtCode !== undefined && !/^D8\d{3}$/.test(data.cdtCode)) {
    res.status(400).json({ error: 'cdtCode must be an orthodontic code in the D8000-D8999 range' });
    return;
  }

  const visitData = {
    caseId: orthoCase.id,
    appointmentId: data.appointmentId,
    date: data.date,
    wireChanged: data.wireChanged ?? false,
    wireStrength: data.wireStrength,
    elasticsUsed: data.elasticsUsed,
    alignerStepNumber: data.alignerStepNumber,
    notes: data.notes,
    nextVisitDate: data.nextVisitDate,
  };

  // ORTHO-07 AC1/AC3: a linked Treatment is only created when both cdtCode
  // and fee are supplied; when it is, Treatment + visit are created in a
  // single Prisma transaction (AC8 of the visits story) so a failure to
  // create the Treatment leaves no visit behind either.
  const createsBilling = data.cdtCode !== undefined && data.fee !== undefined;

  const visit = createsBilling
    ? await prisma.$transaction(async (tx) => {
        const treatment = await tx.treatment.create({
          data: {
            patientId: orthoCase.patientId,
            providerId: req.auth!.providerId,
            date: data.date,
            cdtCode: data.cdtCode!,
            description: `Orthodontic visit (${data.cdtCode})`,
            fee: data.fee!,
          },
        });
        return tx.orthodonticVisit.create({
          data: { ...visitData, treatmentId: treatment.id },
        });
      })
    : await prisma.orthodonticVisit.create({ data: visitData });

  res.status(201).json(visit);
});

export default router;
