import fs from 'fs';
import path from 'path';
import { env } from './env';

const uploadDir = path.resolve(env.UPLOAD_DIR);

export function ensureUploadDir(): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

export function getUploadPath(patientId: string, filename: string): string {
  const patientDir = path.join(uploadDir, patientId);
  if (!fs.existsSync(patientDir)) {
    fs.mkdirSync(patientDir, { recursive: true });
  }
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(patientDir, `${timestamp}-${safeName}`);
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/** Resolve a filePath stored on DentalImage (absolute or a bare filename
 *  from before that column stored relative paths) to an absolute path. */
export function resolveUploadPath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(uploadDir, filePath);
}

export { uploadDir };
