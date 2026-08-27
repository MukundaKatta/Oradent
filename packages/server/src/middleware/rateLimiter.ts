import rateLimit from 'express-rate-limit';
import { Request } from 'express';

function keyGenerator(req: Request): string {
  // Use authenticated user ID if available, otherwise fall back to IP
  if (req.auth?.providerId) {
    return `user:${req.auth.providerId}`;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// apiLimiter is mounted globally in index.ts, before any router — and every
// router's own `authenticate` middleware is what actually sets req.auth.
// So unlike aiLimiter (mounted after router.use(authenticate) in ai.ts),
// req.auth is never populated yet when this runs: it is always IP-based in
// practice, regardless of the shared keyGenerator. That's the correct
// behavior for a limiter that has to apply before routing decides who the
// caller is — per-user limiting for authenticated traffic is what aiLimiter
// and similar per-router limiters are for.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request rate limit exceeded. Please wait before trying again.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit exceeded' },
});
