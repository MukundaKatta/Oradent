import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Short-lived, narrowly-scoped token for serving one dental image. Plain
// <img src> / <a href> can't send an Authorization header, so file URLs
// can't reuse the normal Bearer-token `authenticate` middleware — but they
// still need to be per-practice-scoped and expire quickly, rather than the
// permanently-public /uploads static mount this replaces.
interface FileAccessPayload {
  imageId: string;
  practiceId: string;
  purpose: 'image-access';
}

export function generateFileAccessToken(imageId: string, practiceId: string): string {
  const payload: FileAccessPayload = { imageId, practiceId, purpose: 'image-access' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '10m' });
}

export function verifyFileAccessToken(token: string, imageId: string): { practiceId: string } | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as FileAccessPayload;
    if (payload.purpose !== 'image-access' || payload.imageId !== imageId) {
      return null;
    }
    return { practiceId: payload.practiceId };
  } catch {
    return null;
  }
}
