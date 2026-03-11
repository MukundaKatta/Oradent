import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get practice settings
router.get('/practice', async (req: Request, res: Response) => {
  const practice = await prisma.practice.findUnique({
    where: { id: req.auth!.practiceId },
    include: { settings: true, chairs: true, providers: { select: { id: true, name: true, email: true, role: true, title: true, color: true, isActive: true } } },
  });

  if (!practice) {
    res.status(404).json({ error: 'Practice not found' });
    return;
  }

  res.json(practice);
});

// Update practice info
router.put('/practice', authorize('OWNER'), async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    taxId: z.string().optional(),
    npi: z.string().optional(),
  });

  const data = schema.parse(req.body);

  const practice = await prisma.practice.update({
    where: { id: req.auth!.practiceId },
    data,
  });

  res.json(practice);
});

// Update practice settings
router.put('/practice/settings', authorize('OWNER'), async (req: Request, res: Response) => {
  const schema = z.object({
    appointmentDuration: z.number().min(15).max(240).optional(),
    workingHoursStart: z.string().optional(),
    workingHoursEnd: z.string().optional(),
    workingDays: z.array(z.number().min(0).max(6)).optional(),
    reminderHoursBefore: z.number().min(1).max(72).optional(),
    currency: z.string().optional(),
  });

  const data = schema.parse(req.body);

  const settings = await prisma.practiceSettings.upsert({
    where: { practiceId: req.auth!.practiceId },
    create: { practiceId: req.auth!.practiceId, ...data },
    update: data,
  });

  res.json(settings);
});

// Manage providers
router.get('/providers', async (req: Request, res: Response) => {
  const providers = await prisma.provider.findMany({
    where: { practiceId: req.auth!.practiceId },
    select: { id: true, name: true, email: true, role: true, title: true, color: true, isActive: true, npi: true, licenseNumber: true },
  });

  res.json(providers);
});

// Manage chairs
router.post('/chairs', authorize('OWNER'), async (req: Request, res: Response) => {
  const { name } = z.object({ name: z.string().min(1) }).parse(req.body);

  const chair = await prisma.chair.create({
    data: { practiceId: req.auth!.practiceId, name },
  });

  res.status(201).json(chair);
});

router.put('/chairs/:id', authorize('OWNER'), async (req: Request, res: Response) => {
  const { name, isActive } = z.object({
    name: z.string().optional(),
    isActive: z.boolean().optional(),
  }).parse(req.body);

  const chair = await prisma.chair.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
  });

  res.json(chair);
});

export default router;
