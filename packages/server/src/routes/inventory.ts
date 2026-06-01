import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ── In-memory store (placeholder until Prisma model is added) ──

interface InventoryItem {
  id: string;
  practiceId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StockAdjustment {
  id: string;
  itemId: string;
  practiceId: string;
  quantityChange: number;
  reason: string;
  adjustedBy: string;
  createdAt: Date;
}

const inventoryItems: InventoryItem[] = [];
const stockAdjustments: StockAdjustment[] = [];

function cuid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// ── Schemas ──

const createItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  unitCost: z.number().min(0),
  supplier: z.string().min(1),
});

const updateItemSchema = createItemSchema.partial();

const adjustStockSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().min(1),
});

// ── Routes ──

// List inventory items with search, category filter, lowStockOnly, pagination
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || '';
  const category = req.query.category as string | undefined;
  const lowStockOnly = req.query.lowStockOnly === 'true';
  const practiceId = req.auth!.practiceId;

  let filtered = inventoryItems.filter((i) => i.practiceId === practiceId && i.isActive);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.supplier.toLowerCase().includes(q)
    );
  }

  if (category) {
    filtered = filtered.filter((i) => i.category === category);
  }

  if (lowStockOnly) {
    filtered = filtered.filter((i) => i.quantity <= i.reorderLevel);
  }

  filtered.sort((a, b) => a.name.localeCompare(b.name));

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * limit, page * limit);

  res.json({
    items: paged,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Items below reorder level
router.get('/low-stock', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const lowStock = inventoryItems.filter(
    (i) => i.practiceId === practiceId && i.isActive && i.quantity <= i.reorderLevel
  );

  lowStock.sort((a, b) => a.quantity - a.reorderLevel - (b.quantity - b.reorderLevel));

  res.json({ items: lowStock, total: lowStock.length });
});

// List distinct categories
router.get('/categories', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const categories = [
    ...new Set(
      inventoryItems
        .filter((i) => i.practiceId === practiceId && i.isActive)
        .map((i) => i.category)
    ),
  ].sort();

  res.json(categories);
});

// Create item (OWNER only)
router.post('/', authorize('OWNER'), async (req: Request, res: Response) => {
  const data = createItemSchema.parse(req.body);
  const practiceId = req.auth!.practiceId;

  // Check for duplicate SKU within practice
  const existing = inventoryItems.find(
    (i) => i.practiceId === practiceId && i.sku === data.sku && i.isActive
  );
  if (existing) {
    res.status(409).json({ error: 'An item with this SKU already exists' });
    return;
  }

  const now = new Date();
  const item: InventoryItem = {
    id: cuid(),
    practiceId,
    ...data,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  inventoryItems.push(item);

  res.status(201).json(item);
});

// Update item (OWNER only)
router.put('/:id', authorize('OWNER'), async (req: Request, res: Response) => {
  const data = updateItemSchema.parse(req.body);

  const item = inventoryItems.find(
    (i) => i.id === req.params.id && i.practiceId === req.auth!.practiceId && i.isActive
  );
  if (!item) {
    res.status(404).json({ error: 'Inventory item not found' });
    return;
  }

  if (data.name !== undefined) item.name = data.name;
  if (data.sku !== undefined) item.sku = data.sku;
  if (data.category !== undefined) item.category = data.category;
  if (data.quantity !== undefined) item.quantity = data.quantity;
  if (data.reorderLevel !== undefined) item.reorderLevel = data.reorderLevel;
  if (data.unitCost !== undefined) item.unitCost = data.unitCost;
  if (data.supplier !== undefined) item.supplier = data.supplier;
  item.updatedAt = new Date();

  res.json(item);
});

// Adjust stock (quantity change + reason)
router.post('/:id/adjust', async (req: Request, res: Response) => {
  const data = adjustStockSchema.parse(req.body);

  const item = inventoryItems.find(
    (i) => i.id === req.params.id && i.practiceId === req.auth!.practiceId && i.isActive
  );
  if (!item) {
    res.status(404).json({ error: 'Inventory item not found' });
    return;
  }

  const newQuantity = item.quantity + data.quantity;
  if (newQuantity < 0) {
    res.status(400).json({ error: 'Insufficient stock for this adjustment' });
    return;
  }

  item.quantity = newQuantity;
  item.updatedAt = new Date();

  const adjustment: StockAdjustment = {
    id: cuid(),
    itemId: item.id,
    practiceId: req.auth!.practiceId,
    quantityChange: data.quantity,
    reason: data.reason,
    adjustedBy: req.auth!.providerId,
    createdAt: new Date(),
  };

  stockAdjustments.push(adjustment);

  res.json({ item, adjustment });
});

export default router;
