import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ── In-memory stores (placeholder until Prisma models are added) ──

interface Communication {
  id: string;
  practiceId: string;
  patientId: string;
  type: 'SMS' | 'EMAIL' | 'PUSH';
  subject: string | null;
  body: string;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageTemplate {
  id: string;
  practiceId: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communications: Communication[] = [];
const templates: MessageTemplate[] = [];

function cuid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// ── Schemas ──

const createCommunicationSchema = z.object({
  patientId: z.string().min(1),
  type: z.enum(['SMS', 'EMAIL', 'PUSH']),
  subject: z.string().nullable().optional(),
  body: z.string().min(1),
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
});

const updateTemplateSchema = createTemplateSchema.partial();

// ── Communication routes ──

// List communications with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;
  const patientId = req.query.patientId as string | undefined;
  const practiceId = req.auth!.practiceId;

  let filtered = communications.filter((c) => c.practiceId === practiceId);

  if (type) {
    filtered = filtered.filter((c) => c.type === type);
  }
  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (patientId) {
    filtered = filtered.filter((c) => c.patientId === patientId);
  }

  // Sort newest first
  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * limit, page * limit);

  res.json({
    communications: paged,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Create a new communication
router.post('/', async (req: Request, res: Response) => {
  const data = createCommunicationSchema.parse(req.body);

  // Validate patient belongs to practice
  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const now = new Date();
  const communication: Communication = {
    id: cuid(),
    practiceId: req.auth!.practiceId,
    patientId: data.patientId,
    type: data.type,
    subject: data.subject ?? null,
    body: data.body,
    status: 'PENDING',
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  };

  communications.push(communication);

  res.status(201).json(communication);
});

// ── Template routes ──

// List message templates
router.get('/templates', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const active = templates.filter(
    (t) => t.practiceId === practiceId && !t.isArchived
  );

  res.json(active);
});

// Create template
router.post('/templates', async (req: Request, res: Response) => {
  const data = createTemplateSchema.parse(req.body);

  const now = new Date();
  const template: MessageTemplate = {
    id: cuid(),
    practiceId: req.auth!.practiceId,
    name: data.name,
    subject: data.subject,
    body: data.body,
    variables: data.variables,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  templates.push(template);

  res.status(201).json(template);
});

// Update template
router.put('/templates/:id', async (req: Request, res: Response) => {
  const data = updateTemplateSchema.parse(req.body);

  const template = templates.find(
    (t) => t.id === req.params.id && t.practiceId === req.auth!.practiceId && !t.isArchived
  );
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  if (data.name !== undefined) template.name = data.name;
  if (data.subject !== undefined) template.subject = data.subject;
  if (data.body !== undefined) template.body = data.body;
  if (data.variables !== undefined) template.variables = data.variables;
  template.updatedAt = new Date();

  res.json(template);
});

// Delete template (soft delete)
router.delete('/templates/:id', async (req: Request, res: Response) => {
  const template = templates.find(
    (t) => t.id === req.params.id && t.practiceId === req.auth!.practiceId && !t.isArchived
  );
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  template.isArchived = true;
  template.updatedAt = new Date();

  res.json({ message: 'Template archived successfully' });
});

export default router;
