import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ── In-memory store (placeholder until Prisma model is added) ──

interface WaitlistEntry {
  id: string;
  practiceId: string;
  patientId: string;
  preferredDate: Date;
  preferredProviderId: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'WAITING' | 'NOTIFIED' | 'SCHEDULED' | 'CANCELLED';
  notes: string | null;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistEntries: WaitlistEntry[] = [];

function cuid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// ── Schemas ──

const createWaitlistSchema = z.object({
  patientId: z.string().min(1),
  preferredDate: z.string().transform((s) => new Date(s)),
  preferredProviderId: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  notes: z.string().nullable().optional(),
});

const updateWaitlistSchema = z.object({
  preferredDate: z.string().transform((s) => new Date(s)).optional(),
  preferredProviderId: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['WAITING', 'NOTIFIED', 'SCHEDULED', 'CANCELLED']).optional(),
  notes: z.string().nullable().optional(),
});

// ── Routes ──

// List waitlist entries with filters
router.get('/', async (req: Request, res: Response) => {
  const providerId = req.query.providerId as string | undefined;
  const priority = req.query.priority as string | undefined;
  const status = req.query.status as string | undefined;
  const practiceId = req.auth!.practiceId;

  let filtered = waitlistEntries.filter((e) => e.practiceId === practiceId);

  if (providerId) {
    filtered = filtered.filter((e) => e.preferredProviderId === providerId);
  }
  if (priority) {
    filtered = filtered.filter((e) => e.priority === priority);
  }
  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }

  // Sort by priority (URGENT first), then by creation date
  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
  filtered.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  res.json({ entries: filtered, total: filtered.length });
});

// Add to waitlist
router.post('/', async (req: Request, res: Response) => {
  const data = createWaitlistSchema.parse(req.body);

  // Validate patient belongs to practice
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  // Validate provider if specified
  if (data.preferredProviderId) {
    const provider = await prisma.provider.findFirst({
      where: { id: data.preferredProviderId, practiceId: req.auth!.practiceId, isActive: true },
    });
    if (!provider) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
  }

  const now = new Date();
  const entry: WaitlistEntry = {
    id: cuid(),
    practiceId: req.auth!.practiceId,
    patientId: data.patientId,
    preferredDate: data.preferredDate,
    preferredProviderId: data.preferredProviderId ?? null,
    priority: data.priority,
    status: 'WAITING',
    notes: data.notes ?? null,
    notifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  waitlistEntries.push(entry);

  res.status(201).json(entry);
});

// Update waitlist entry
router.put('/:id', async (req: Request, res: Response) => {
  const data = updateWaitlistSchema.parse(req.body);

  const entry = waitlistEntries.find(
    (e) => e.id === req.params.id && e.practiceId === req.auth!.practiceId
  );
  if (!entry) {
    res.status(404).json({ error: 'Waitlist entry not found' });
    return;
  }

  if (data.preferredDate !== undefined) entry.preferredDate = data.preferredDate;
  if (data.preferredProviderId !== undefined) entry.preferredProviderId = data.preferredProviderId ?? null;
  if (data.priority !== undefined) entry.priority = data.priority;
  if (data.status !== undefined) entry.status = data.status;
  if (data.notes !== undefined) entry.notes = data.notes ?? null;
  entry.updatedAt = new Date();

  res.json(entry);
});

// Remove from waitlist
router.delete('/:id', async (req: Request, res: Response) => {
  const idx = waitlistEntries.findIndex(
    (e) => e.id === req.params.id && e.practiceId === req.auth!.practiceId
  );
  if (idx === -1) {
    res.status(404).json({ error: 'Waitlist entry not found' });
    return;
  }

  waitlistEntries.splice(idx, 1);

  res.json({ message: 'Waitlist entry removed' });
});

// Mark patient as notified
router.post('/:id/notify', async (req: Request, res: Response) => {
  const entry = waitlistEntries.find(
    (e) => e.id === req.params.id && e.practiceId === req.auth!.practiceId
  );
  if (!entry) {
    res.status(404).json({ error: 'Waitlist entry not found' });
    return;
  }

  entry.status = 'NOTIFIED';
  entry.notifiedAt = new Date();
  entry.updatedAt = new Date();

  res.json(entry);
});

export default router;
