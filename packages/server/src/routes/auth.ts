import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticate, blacklistToken, AuthPayload } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { sendEmail, generatePasswordResetEmail } from '../services/emailService';

const router = Router();

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const registerSchema = z.object({
  practiceName: z.string().min(2),
  practiceAddress: z.string().min(5),
  practicePhone: z.string().min(7),
  practiceEmail: z.string().email(),
  providerName: z.string().min(2),
  providerEmail: z.string().email(),
  password: passwordSchema,
  title: z.string().default('DDS'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function buildTokenResponse(payload: AuthPayload) {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

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
  const payload: AuthPayload = {
    providerId: provider.id,
    practiceId: practice.id,
    role: provider.role,
    email: provider.email,
  };
  const tokens = buildTokenResponse(payload);

  logger.info({ practiceId: practice.id }, 'New practice registered');

  res.status(201).json({
    ...tokens,
    // Backwards compatibility
    token: tokens.accessToken,
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

  const payload: AuthPayload = {
    providerId: provider.id,
    practiceId: provider.practiceId,
    role: provider.role,
    email: provider.email,
  };
  const tokens = buildTokenResponse(payload);

  logger.info({ providerId: provider.id }, 'Provider logged in');

  res.json({
    ...tokens,
    // Backwards compatibility
    token: tokens.accessToken,
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

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

  try {
    const payload = verifyRefreshToken(refreshToken);

    // Verify provider still exists and is active
    const provider = await prisma.provider.findUnique({
      where: { id: payload.providerId },
    });
    if (!provider || !provider.isActive) {
      res.status(401).json({ error: 'Account is deactivated' });
      return;
    }

    const newPayload: AuthPayload = {
      providerId: provider.id,
      practiceId: provider.practiceId,
      role: provider.role,
      email: provider.email,
    };
    const tokens = buildTokenResponse(newPayload);

    res.json({
      ...tokens,
      token: tokens.accessToken,
    });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout (blacklist current token)
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7);
  if (token) {
    await blacklistToken(token);
  }
  res.json({ message: 'Logged out successfully' });
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

// Forgot password — request a reset token
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  // Always return the same response to avoid leaking whether the email exists
  const provider = await prisma.provider.findUnique({ where: { email } });

  if (provider) {
    const token = crypto.randomBytes(32).toString('hex');
    // Store in Redis with 1-hour TTL: reset:<token> → providerId
    await redis.set(`reset:${token}`, provider.id, 'EX', 3600);
    logger.info({ providerId: provider.id }, 'Password reset token generated');

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const practice = await prisma.practice.findFirst({
      where: { providers: { some: { id: provider.id } } },
      select: { name: true },
    });
    const html = generatePasswordResetEmail(practice?.name || 'Oradent', resetUrl);
    await sendEmail(provider.email, 'Password Reset Request', html);
  }

  res.json({ message: 'If the email exists, a reset link has been sent' });
});

// Reset password — consume a reset token
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  const { token, newPassword } = z.object({
    token: z.string().min(1),
    newPassword: passwordSchema,
  }).parse(req.body);

  const providerId = await redis.get(`reset:${token}`);
  if (!providerId) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.provider.update({
    where: { id: providerId },
    data: { passwordHash },
  });

  // Delete the token so it cannot be reused
  await redis.del(`reset:${token}`);

  logger.info({ providerId }, 'Password reset completed');

  res.json({ message: 'Password reset successfully' });
});

// Change password
const changePasswordHandler = async (req: Request, res: Response) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: passwordSchema,
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

  res.json({ message: 'Password changed successfully' });
};

router.put('/password', authenticate, changePasswordHandler);
router.post('/change-password', authenticate, changePasswordHandler);

export default router;
