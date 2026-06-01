import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitize a value:
 * - Trim strings and strip HTML tags
 * - Recurse into plain objects and arrays
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Strip HTML tags, then trim whitespace
    return value.replace(/<[^>]*>/g, '').trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Express middleware that trims string fields and strips HTML tags
 * from req.body to prevent XSS and clean up user input.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
