import { Request, Response, NextFunction } from 'express';

export function requestTimeout(ms: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    });
    next();
  };
}
