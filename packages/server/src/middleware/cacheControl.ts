import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware that sets Cache-Control: no-store for sensitive endpoints.
 * Prevents browsers and proxies from caching response data.
 */
export function noCache() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  };
}

/**
 * Middleware that sets Cache-Control with a specified max-age for static-ish data
 * (e.g. fee schedules, CDT code lists).
 */
export function shortCache(seconds: number) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Cache-Control', `public, max-age=${seconds}`);
    next();
  };
}

/**
 * Middleware that adds ETag headers based on the response body content.
 * Allows conditional requests (If-None-Match) to return 304 Not Modified.
 */
export function etagSupport() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown): Response {
      const bodyString = JSON.stringify(body);
      const etag = `"${crypto.createHash('md5').update(bodyString).digest('hex')}"`;

      res.setHeader('ETag', etag);

      // Check If-None-Match header from client
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        res.status(304).end();
        return res;
      }

      return originalJson(body);
    };

    next();
  };
}
