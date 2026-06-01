import { Response } from 'express';

export function success(res: Response, data: unknown, status = 200) {
  res.status(status).json(data);
}

export function created(res: Response, data: unknown) {
  res.status(201).json(data);
}

export function noContent(res: Response) {
  res.status(204).end();
}

export function badRequest(res: Response, message: string, fields?: Record<string, string>) {
  res.status(400).json({ error: message, fields });
}

export function notFound(res: Response, resource = 'Resource') {
  res.status(404).json({ error: `${resource} not found` });
}

export function conflict(res: Response, message: string) {
  res.status(409).json({ error: message });
}

export function forbidden(res: Response, message = 'Access denied') {
  res.status(403).json({ error: message });
}
