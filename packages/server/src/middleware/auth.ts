import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { ProviderRole } from '@prisma/client';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { cached, invalidateCache } from '../utils/cache';

export interface AuthPayload {
  providerId: string;
  practiceId: string;
  role: ProviderRole;
  email: string;
  sessionVersion: number;
  type?: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function sessionVersionCacheKey(providerId: string): string {
  return `sv:${providerId}`;
}

async function getCurrentSessionVersion(providerId: string): Promise<number | null> {
  return cached(sessionVersionCacheKey(providerId), 60, async () => {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { sessionVersion: true },
    });
    return provider?.sessionVersion ?? null;
  });
}

/**
 * Bump a provider's session version, invalidating every access/refresh token
 * issued before the call (their embedded sessionVersion will no longer
 * match). Used on logout, password change, and admin password reset — the
 * access-token blacklist alone doesn't cover the refresh token, which stays
 * valid for days after logout otherwise.
 */
export async function invalidateSessions(providerId: string): Promise<void> {
  await prisma.provider.update({
    where: { id: providerId },
    data: { sessionVersion: { increment: 1 } },
  });
  await invalidateCache(sessionVersionCacheKey(providerId));
}

export class TokenRejectedError extends Error {
  constructor(public code: 'EXPIRED' | 'INVALID_TYPE' | 'REVOKED' | 'INVALID') {
    super(code);
  }
}

/**
 * Verify an access token: signature/expiry, not a refresh token, not
 * blacklisted (logout), and its sessionVersion still matches the current
 * one (logout/password change/reset). Shared by the HTTP `authenticate`
 * middleware and the WebSocket handshake, which previously only checked
 * the JWT signature and skipped both revocation checks entirely.
 */
export async function verifyAccessToken(token: string): Promise<AuthPayload> {
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new TokenRejectedError('EXPIRED');
    }
    throw new TokenRejectedError('INVALID');
  }

  if (payload.type === 'refresh') {
    throw new TokenRejectedError('INVALID_TYPE');
  }

  const isBlacklisted = await redis.get(`bl:${hashToken(token)}`);
  if (isBlacklisted) {
    throw new TokenRejectedError('REVOKED');
  }

  const currentVersion = await getCurrentSessionVersion(payload.providerId);
  if (currentVersion === null || payload.sessionVersion !== currentVersion) {
    throw new TokenRejectedError('REVOKED');
  }

  return payload;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  try {
    req.auth = await verifyAccessToken(token);
    next();
  } catch (err: unknown) {
    if (err instanceof TokenRejectedError && err.code === 'EXPIRED') {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (err instanceof TokenRejectedError && err.code === 'REVOKED') {
      res.status(401).json({ error: 'Session has been revoked' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...roles: ProviderRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function generateToken(payload: Omit<AuthPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as string & { __brand?: never },
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: Omit<AuthPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as string & { __brand?: never },
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): AuthPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Not a refresh token');
  }
  return payload;
}

/** Blacklist a token on logout. TTL matches remaining token lifetime. */
export async function blacklistToken(token: string): Promise<void> {
  try {
    const payload = jwt.decode(token) as (AuthPayload & { exp?: number }) | null;
    if (payload?.exp) {
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.set(`bl:${hashToken(token)}`, '1', 'EX', ttl);
      }
    }
  } catch {
    // Token already invalid
  }
}
