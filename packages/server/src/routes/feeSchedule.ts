import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── In-memory store (placeholder until Prisma model is wired) ───

interface FeeScheduleItem {
  id: string;
  practiceId: string;
  cdtCode: string;
  description: string;
  category: string;
  fee: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const feeItems: FeeScheduleItem[] = [];
let nextId = 1;

function generateId(): string {
  return `fee_${Date.now()}_${nextId++}`;
}

// ─── Schemas ───

const createFeeItemSchema = z.object({
  cdtCode: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  fee: z.number().min(0),
});

const updateFeeItemSchema = createFeeItemSchema.partial();

const bulkImportSchema = z.object({
  items: z.array(createFeeItemSchema),
});

// ─── Routes ───

// List distinct categories
router.get('/categories', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const categories = [
    ...new Set(
      feeItems
        .filter((item) => item.practiceId === practiceId && !item.isDeleted)
        .map((item) => item.category)
    ),
  ].sort();

  res.json({ categories });
});

// List fee schedule items (search, category filter, pagination)
router.get('/', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const search = (req.query.search as string) || '';
  const category = req.query.category as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  let items = feeItems.filter(
    (item) => item.practiceId === practiceId && !item.isDeleted
  );

  if (search) {
    const lower = search.toLowerCase();
    items = items.filter(
      (item) =>
        item.cdtCode.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower)
    );
  }

  if (category) {
    items = items.filter((item) => item.category === category);
  }

  items.sort((a, b) => a.cdtCode.localeCompare(b.cdtCode));

  const total = items.length;
  const paged = items.slice((page - 1) * limit, page * limit);

  res.json({
    items: paged,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Create fee item (OWNER only)
router.post('/', authorize('OWNER'), (req: Request, res: Response) => {
  const data = createFeeItemSchema.parse(req.body);
  const practiceId = req.auth!.practiceId;

  // Check for duplicate CDT code within practice
  const existing = feeItems.find(
    (item) =>
      item.practiceId === practiceId &&
      item.cdtCode === data.cdtCode &&
      !item.isDeleted
  );
  if (existing) {
    res.status(409).json({ error: 'A fee item with this CDT code already exists' });
    return;
  }

  const now = new Date();
  const item: FeeScheduleItem = {
    id: generateId(),
    practiceId,
    ...data,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  feeItems.push(item);
  res.status(201).json(item);
});

// Update fee item (OWNER only)
router.put('/:id', authorize('OWNER'), (req: Request, res: Response) => {
  const data = updateFeeItemSchema.parse(req.body);
  const practiceId = req.auth!.practiceId;

  const item = feeItems.find(
    (i) => i.id === req.params.id && i.practiceId === practiceId && !i.isDeleted
  );
  if (!item) {
    res.status(404).json({ error: 'Fee item not found' });
    return;
  }

  // If cdtCode is being changed, check for duplicates
  if (data.cdtCode && data.cdtCode !== item.cdtCode) {
    const duplicate = feeItems.find(
      (i) =>
        i.practiceId === practiceId &&
        i.cdtCode === data.cdtCode &&
        !i.isDeleted &&
        i.id !== item.id
    );
    if (duplicate) {
      res.status(409).json({ error: 'A fee item with this CDT code already exists' });
      return;
    }
  }

  Object.assign(item, data, { updatedAt: new Date() });
  res.json(item);
});

// Soft delete fee item (OWNER only)
router.delete('/:id', authorize('OWNER'), (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;

  const item = feeItems.find(
    (i) => i.id === req.params.id && i.practiceId === practiceId && !i.isDeleted
  );
  if (!item) {
    res.status(404).json({ error: 'Fee item not found' });
    return;
  }

  item.isDeleted = true;
  item.updatedAt = new Date();
  res.json({ message: 'Fee item deleted' });
});

// Bulk import from array (OWNER only)
router.post('/import', authorize('OWNER'), (req: Request, res: Response) => {
  const { items } = bulkImportSchema.parse(req.body);
  const practiceId = req.auth!.practiceId;
  const now = new Date();

  const imported: FeeScheduleItem[] = [];
  const skipped: Array<{ cdtCode: string; reason: string }> = [];

  for (const data of items) {
    const existing = feeItems.find(
      (i) =>
        i.practiceId === practiceId &&
        i.cdtCode === data.cdtCode &&
        !i.isDeleted
    );

    if (existing) {
      // Update existing item
      Object.assign(existing, data, { updatedAt: now });
      imported.push(existing);
    } else {
      const item: FeeScheduleItem = {
        id: generateId(),
        practiceId,
        ...data,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };
      feeItems.push(item);
      imported.push(item);
    }
  }

  res.status(201).json({
    imported: imported.length,
    skipped,
    items: imported,
  });
});

export default router;
