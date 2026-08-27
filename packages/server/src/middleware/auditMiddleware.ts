import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const PHI_ROUTES = ['/api/patients', '/api/imaging', '/api/dental-chart', '/api/treatments', '/api/billing', '/api/orthodontics'];

// Prisma's default cuid() ids are 25 lowercase alphanumeric chars starting
// with 'c' — distinct enough from route keywords (advanced, tooth, batch,
// invoices, claims, plans, notes, sign, medical-history, ...) that we can
// pick the resource id out of the path regardless of how deep or
// hyphenated the route is, instead of assuming a fixed /api/:resource/:id
// shape that most PHI routes don't actually have.
const CUID_PATTERN = /^c[a-z0-9]{20,30}$/i;

export function parseAuditResource(path: string): { resource: string; resourceId: string } {
  const withoutQuery = path.split('?')[0];
  const pathSegments = withoutQuery.split('/').filter(Boolean);
  const resource = pathSegments[1] || 'unknown';
  const resourceId = [...pathSegments].reverse().find((seg) => CUID_PATTERN.test(seg)) || '';
  return { resource, resourceId };
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const shouldAudit = PHI_ROUTES.some((route) => req.path.startsWith(route));

  if (!shouldAudit || req.method === 'OPTIONS') {
    next();
    return;
  }

  const originalEnd = res.end;
  const startTime = Date.now();

  res.end = function (this: Response, ...args: Parameters<Response['end']>) {
    const duration = Date.now() - startTime;
    // req.originalUrl, NOT req.path: Express temporarily strips the mount
    // prefix from req.path/req.url while dispatching into a sub-router
    // (e.g. the dentalChartRoutes router mounted at /api/dental-chart), and
    // does not restore it until after the nested handler returns — which is
    // before this res.end override fires, since res.json() calls res.end()
    // synchronously from inside that still-nested handler. Reading req.path
    // here saw only the sub-router-relative remainder ("/advanced/:id"
    // instead of "/api/dental-chart/advanced/:id"), so `resource` picked up
    // the id itself as pathSegments[1] instead of "dental-chart".
    // req.originalUrl is set once for the request and never rewritten.
    const { resource, resourceId } = parseAuditResource(req.originalUrl);

    if (req.auth?.providerId) {
      prisma.auditLog
        .create({
          data: {
            providerId: req.auth.providerId,
            action: `${req.method} ${req.originalUrl.split('?')[0]}`,
            resource,
            resourceId,
            details: {
              statusCode: res.statusCode,
              duration,
              query: req.query,
            },
            ipAddress: req.ip || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
          },
        })
        .catch((err) => {
          logger.error(err, 'Failed to create audit log');
        });
    }

    return originalEnd.apply(this, args);
  } as Response['end'];

  next();
}
