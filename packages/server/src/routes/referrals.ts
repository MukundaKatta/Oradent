import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ── In-memory store (placeholder until Prisma model is added) ──

interface Referral {
  id: string;
  practiceId: string;
  patientId: string;
  type: 'INCOMING' | 'OUTGOING';
  referringProvider: string;
  referredTo: string;
  reason: string;
  notes: string | null;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'DECLINED';
  createdAt: Date;
  updatedAt: Date;
}

const referrals: Referral[] = [];

function cuid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// ── Schemas ──

const createReferralSchema = z.object({
  patientId: z.string().min(1),
  referringProvider: z.string().min(1),
  referredTo: z.string().min(1),
  reason: z.string().min(1),
  notes: z.string().nullable().optional(),
  type: z.enum(['INCOMING', 'OUTGOING']),
});

const updateReferralSchema = z.object({
  referringProvider: z.string().min(1).optional(),
  referredTo: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  type: z.enum(['INCOMING', 'OUTGOING']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'SCHEDULED', 'COMPLETED', 'DECLINED']),
});

// ── Routes ──

// List referrals with filters
router.get('/', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const practiceId = req.auth!.practiceId;

  let filtered = referrals.filter((r) => r.practiceId === practiceId);

  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (type) {
    filtered = filtered.filter((r) => r.type === type);
  }

  // Sort newest first
  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ referrals: filtered, total: filtered.length });
});

// Referral statistics
router.get('/stats', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const practiceReferrals = referrals.filter((r) => r.practiceId === practiceId);

  // Count by status
  const byStatus: Record<string, number> = {
    PENDING: 0,
    SCHEDULED: 0,
    COMPLETED: 0,
    DECLINED: 0,
  };
  for (const r of practiceReferrals) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }

  // Top referral sources (referring providers for incoming referrals)
  const sourceCounts: Record<string, number> = {};
  for (const r of practiceReferrals.filter((r) => r.type === 'INCOMING')) {
    sourceCounts[r.referringProvider] = (sourceCounts[r.referringProvider] || 0) + 1;
  }

  const topSources = Object.entries(sourceCounts)
    .map(([provider, count]) => ({ provider, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Count by type
  const incoming = practiceReferrals.filter((r) => r.type === 'INCOMING').length;
  const outgoing = practiceReferrals.filter((r) => r.type === 'OUTGOING').length;

  res.json({
    total: practiceReferrals.length,
    byStatus,
    byType: { incoming, outgoing },
    topSources,
  });
});

// Create referral
router.post('/', async (req: Request, res: Response) => {
  const data = createReferralSchema.parse(req.body);

  // Validate patient belongs to practice
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const now = new Date();
  const referral: Referral = {
    id: cuid(),
    practiceId: req.auth!.practiceId,
    patientId: data.patientId,
    type: data.type,
    referringProvider: data.referringProvider,
    referredTo: data.referredTo,
    reason: data.reason,
    notes: data.notes ?? null,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  referrals.push(referral);

  res.status(201).json(referral);
});

// Update referral
router.put('/:id', async (req: Request, res: Response) => {
  const data = updateReferralSchema.parse(req.body);

  const referral = referrals.find(
    (r) => r.id === req.params.id && r.practiceId === req.auth!.practiceId
  );
  if (!referral) {
    res.status(404).json({ error: 'Referral not found' });
    return;
  }

  if (data.referringProvider !== undefined) referral.referringProvider = data.referringProvider;
  if (data.referredTo !== undefined) referral.referredTo = data.referredTo;
  if (data.reason !== undefined) referral.reason = data.reason;
  if (data.notes !== undefined) referral.notes = data.notes ?? null;
  if (data.type !== undefined) referral.type = data.type;
  referral.updatedAt = new Date();

  res.json(referral);
});

// Update referral status
router.put('/:id/status', async (req: Request, res: Response) => {
  const { status } = updateStatusSchema.parse(req.body);

  const referral = referrals.find(
    (r) => r.id === req.params.id && r.practiceId === req.auth!.practiceId
  );
  if (!referral) {
    res.status(404).json({ error: 'Referral not found' });
    return;
  }

  referral.status = status;
  referral.updatedAt = new Date();

  res.json(referral);
});

export default router;
