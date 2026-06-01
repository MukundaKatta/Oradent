import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── In-memory stores ───

interface Notification {
  id: string;
  practiceId: string;
  providerId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

interface NotificationPreferences {
  providerId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  updatedAt: Date;
}

const notifications: Notification[] = [];
const preferencesStore: NotificationPreferences[] = [];
let nextId = 1;

function generateId(): string {
  return `notif_${Date.now()}_${nextId++}`;
}

// ─── Schemas ───

const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

// ─── Routes ───

// Get notification preferences
router.get('/preferences', (req: Request, res: Response) => {
  const providerId = req.auth!.providerId;

  let prefs = preferencesStore.find((p) => p.providerId === providerId);
  if (!prefs) {
    prefs = {
      providerId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      updatedAt: new Date(),
    };
    preferencesStore.push(prefs);
  }

  res.json(prefs);
});

// Update notification preferences
router.put('/preferences', (req: Request, res: Response) => {
  const data = preferencesSchema.parse(req.body);
  const providerId = req.auth!.providerId;

  let prefs = preferencesStore.find((p) => p.providerId === providerId);
  if (!prefs) {
    prefs = {
      providerId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      updatedAt: new Date(),
    };
    preferencesStore.push(prefs);
  }

  if (data.emailEnabled !== undefined) prefs.emailEnabled = data.emailEnabled;
  if (data.smsEnabled !== undefined) prefs.smsEnabled = data.smsEnabled;
  if (data.pushEnabled !== undefined) prefs.pushEnabled = data.pushEnabled;
  prefs.updatedAt = new Date();

  res.json(prefs);
});

// Mark all notifications as read
router.put('/read-all', (req: Request, res: Response) => {
  const providerId = req.auth!.providerId;
  const practiceId = req.auth!.practiceId;

  let count = 0;
  for (const notif of notifications) {
    if (
      notif.providerId === providerId &&
      notif.practiceId === practiceId &&
      !notif.isRead &&
      !notif.isDeleted
    ) {
      notif.isRead = true;
      count++;
    }
  }

  res.json({ message: 'All notifications marked as read', count });
});

// List notifications for current provider
router.get('/', (req: Request, res: Response) => {
  const providerId = req.auth!.providerId;
  const practiceId = req.auth!.practiceId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const unreadOnly = req.query.unreadOnly === 'true';

  let providerNotifs = notifications.filter(
    (n) =>
      n.providerId === providerId &&
      n.practiceId === practiceId &&
      !n.isDeleted
  );

  if (unreadOnly) {
    providerNotifs = providerNotifs.filter((n) => !n.isRead);
  }

  providerNotifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = providerNotifs.length;
  const unreadCount = providerNotifs.filter((n) => !n.isRead).length;
  const paged = providerNotifs.slice((page - 1) * limit, page * limit);

  res.json({
    notifications: paged,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Mark notification as read
router.put('/:id/read', (req: Request, res: Response) => {
  const providerId = req.auth!.providerId;
  const practiceId = req.auth!.practiceId;

  const notif = notifications.find(
    (n) =>
      n.id === req.params.id &&
      n.providerId === providerId &&
      n.practiceId === practiceId &&
      !n.isDeleted
  );
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  notif.isRead = true;
  res.json(notif);
});

// Delete notification
router.delete('/:id', (req: Request, res: Response) => {
  const providerId = req.auth!.providerId;
  const practiceId = req.auth!.practiceId;

  const notif = notifications.find(
    (n) =>
      n.id === req.params.id &&
      n.providerId === providerId &&
      n.practiceId === practiceId &&
      !n.isDeleted
  );
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  notif.isDeleted = true;
  res.json({ message: 'Notification deleted' });
});

export default router;
