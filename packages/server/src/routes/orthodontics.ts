import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const APPLIANCE_TYPES = ['FIXED_METAL', 'FIXED_CERAMIC', 'LINGUAL', 'ALIGNER', 'RETAINER'] as const;

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

export default router;
