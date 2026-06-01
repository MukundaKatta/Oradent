import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── In-memory store ───

interface Document {
  id: string;
  practiceId: string;
  patientId: string;
  providerId: string;
  filename: string;
  category: string;
  size: number;
  mimeType: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const documents: Document[] = [];
let nextId = 1;

function generateId(): string {
  return `doc_${Date.now()}_${nextId++}`;
}

const DOCUMENT_CATEGORIES = [
  'X-Ray',
  'Insurance',
  'Consent Form',
  'Lab Report',
  'Referral',
  'Treatment Plan',
  'Clinical Photo',
  'Correspondence',
  'Financial',
  'Other',
];

// ─── Schemas ───

const uploadDocumentSchema = z.object({
  filename: z.string().min(1),
  category: z.string().min(1),
  patientId: z.string().min(1),
  size: z.number().int().min(1),
  mimeType: z.string().min(1),
});

const updateCategorySchema = z.object({
  category: z.string().min(1),
});

// ─── Routes ───

// List document categories
router.get('/categories', (_req: Request, res: Response) => {
  res.json({ categories: DOCUMENT_CATEGORIES });
});

// List documents (filter by patientId, category, providerId)
router.get('/', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const patientId = req.query.patientId as string;
  const category = req.query.category as string;
  const providerId = req.query.providerId as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  let docs = documents.filter(
    (doc) => doc.practiceId === practiceId && !doc.isDeleted
  );

  if (patientId) {
    docs = docs.filter((doc) => doc.patientId === patientId);
  }
  if (category) {
    docs = docs.filter((doc) => doc.category === category);
  }
  if (providerId) {
    docs = docs.filter((doc) => doc.providerId === providerId);
  }

  docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = docs.length;
  const paged = docs.slice((page - 1) * limit, page * limit);

  res.json({
    documents: paged,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Upload document metadata
router.post('/', (req: Request, res: Response) => {
  const data = uploadDocumentSchema.parse(req.body);
  const now = new Date();

  const doc: Document = {
    id: generateId(),
    practiceId: req.auth!.practiceId,
    providerId: req.auth!.providerId,
    ...data,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  documents.push(doc);
  res.status(201).json(doc);
});

// Get single document
router.get('/:id', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;

  const doc = documents.find(
    (d) => d.id === req.params.id && d.practiceId === practiceId && !d.isDeleted
  );
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  res.json(doc);
});

// Soft delete document
router.delete('/:id', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;

  const doc = documents.find(
    (d) => d.id === req.params.id && d.practiceId === practiceId && !d.isDeleted
  );
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  doc.isDeleted = true;
  doc.updatedAt = new Date();
  res.json({ message: 'Document deleted' });
});

// Update document category
router.put('/:id/category', (req: Request, res: Response) => {
  const { category } = updateCategorySchema.parse(req.body);
  const practiceId = req.auth!.practiceId;

  const doc = documents.find(
    (d) => d.id === req.params.id && d.practiceId === practiceId && !d.isDeleted
  );
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  doc.category = category;
  doc.updatedAt = new Date();
  res.json(doc);
});

export default router;
