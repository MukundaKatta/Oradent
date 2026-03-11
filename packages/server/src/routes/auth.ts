import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { generateToken, authenticate, AuthPayload } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';

const router = Router();

const registerSchema = z.object({
  practiceName: z.string().min(2),
  practiceAddress: z.string().min(5),
  practicePhone: z.string().min(7),
  practiceEmail: z.string().email(),
  providerName: z.string().min(2),
  providerEmail: z.string().email(),
  password: z.string().min(8),
  title: z.string().default('DDS'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register (creates practice + owner provider)
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.provider.findUnique({
    where: { email: data.providerEmail },
  });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const practice = await prisma.practice.create({
    data: {
      name: data.practiceName,
      address: data.practiceAddress,
      phone: data.practicePhone,
      email: data.practiceEmail,
      settings: { create: {} },
      chairs: {
        createMany: {
          data: [
            { name: 'Chair 1' },
            { name: 'Chair 2' },
            { name: 'Chair 3' },
          ],
        },
      },
      providers: {
        create: {
          name: data.providerName,
          email: data.providerEmail,
          passwordHash,
          title: data.title,
          role: 'OWNER',
          color: '#6366f1',
        },
      },
    },
    include: {
      providers: true,
      chairs: true,
    },
  });

  const provider = practice.providers[0];
  const token = generateToken({
    providerId: provider.id,
    practiceId: practice.id,
    role: provider.role,
    email: provider.email,
  });

  logger.info({ practiceId: practice.id }, 'New practice registered');

  res.status(201).json({
    token,
    provider: {
      id: provider.id,
      name: provider.name,
      email: provider.email,
      role: provider.role,
      title: provider.title,
    },
    practice: {
      id: practice.id,
      name: practice.name,
    },
  });
});

// Login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const provider = await prisma.provider.findUnique({
    where: { email: data.email },
    include: { practice: true },
  });

  if (!provider || !provider.isActive) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(data.password, provider.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({
    providerId: provider.id,
    practiceId: provider.practiceId,
    role: provider.role,
    email: provider.email,
  });

  logger.info({ providerId: provider.id }, 'Provider logged in');

  res.json({
    token,
    provider: {
      id: provider.id,
      name: provider.name,
      email: provider.email,
      role: provider.role,
      title: provider.title,
      color: provider.color,
    },
    practice: {
      id: provider.practice.id,
      name: provider.practice.name,
    },
  });
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const provider = await prisma.provider.findUnique({
    where: { id: req.auth!.providerId },
    include: { practice: { include: { settings: true, chairs: true } } },
  });

  if (!provider) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }

  res.json({
    provider: {
      id: provider.id,
      name: provider.name,
      email: provider.email,
      role: provider.role,
      title: provider.title,
      color: provider.color,
    },
    practice: {
      id: provider.practice.id,
      name: provider.practice.name,
      address: provider.practice.address,
      phone: provider.practice.phone,
      email: provider.practice.email,
      settings: provider.practice.settings,
      chairs: provider.practice.chairs,
    },
  });
});

// Change password
router.put('/password', authenticate, async (req: Request, res: Response) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
  });
  const data = schema.parse(req.body);

  const provider = await prisma.provider.findUnique({
    where: { id: req.auth!.providerId },
  });
  if (!provider) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }

  const valid = await bcrypt.compare(data.currentPassword, provider.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.provider.update({
    where: { id: provider.id },
    data: { passwordHash },
  });

  res.json({ message: 'Password updated successfully' });
});

export default router;
