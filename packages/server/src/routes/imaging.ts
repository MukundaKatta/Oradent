import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { uploadImage } from '../middleware/upload';
import { deleteFile, resolveUploadPath } from '../config/storage';
import { generateFileAccessToken, verifyFileAccessToken } from '../services/fileAccessToken';
import { detectFileKind } from '../utils/fileSignature';

const router = Router();
router.use(authenticate);

function buildImageUrl(imageId: string, practiceId: string): string {
  const token = generateFileAccessToken(imageId, practiceId);
  return `/api/imaging/file/${imageId}?token=${token}`;
}

// List images for a patient
router.get('/:patientId', async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const where: Record<string, unknown> = {
    patientId: req.params.patientId,
    patient: { practiceId: req.auth!.practiceId },
  };
  if (type) where.type = type;

  const images = await prisma.dentalImage.findMany({
    where: where as any,
    include: {
      aiAnalyses: { select: { id: true, type: true, confidence: true, accepted: true, createdAt: true } },
    },
    orderBy: { dateTaken: 'desc' },
  });

  const imagesWithUrls = images.map((img) => ({
    ...img,
    url: buildImageUrl(img.id, req.auth!.practiceId),
  }));

  res.json(imagesWithUrls);
});

// Upload image
router.post('/:patientId', uploadLimiter, uploadImage.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    deleteFile(req.file.path);
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  // Verify the actual file content, not just the client-supplied mimetype
  // multer's fileFilter checked — a mismatch (e.g. a renamed .svg with a
  // script payload) gets the upload rejected and the file removed instead
  // of stored and later served back from this API's own origin.
  const header = Buffer.alloc(132);
  const fd = fs.openSync(req.file.path, 'r');
  fs.readSync(fd, header, 0, 132, 0);
  fs.closeSync(fd);
  const kind = detectFileKind(header);
  if (!kind) {
    deleteFile(req.file.path);
    res.status(400).json({ error: 'File content does not match an allowed image format' });
    return;
  }

  const bodySchema = z.object({
    type: z.enum([
      'PERIAPICAL', 'BITEWING', 'PANORAMIC', 'CEPHALOMETRIC',
      'CBCT', 'INTRAORAL_PHOTO', 'EXTRAORAL_PHOTO', 'OTHER',
    ]),
    toothNumbers: z.string().transform((s) => s ? JSON.parse(s) : []).optional(),
    notes: z.string().optional(),
  });

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(req.body);
  } catch (err) {
    deleteFile(req.file.path);
    throw err;
  }

  const image = await prisma.dentalImage.create({
    data: {
      patientId: req.params.patientId,
      type: data.type,
      // Stored relative to uploadDir (resolveUploadPath handles legacy
      // absolute paths from before this change) so the DB row doesn't break
      // if UPLOAD_DIR is ever relocated.
      filePath: path.basename(req.file.path),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      toothNumbers: (data.toothNumbers as number[]) || [],
      notes: data.notes,
    },
  });

  res.status(201).json({
    ...image,
    url: buildImageUrl(image.id, req.auth!.practiceId),
  });
});

// Update image annotations
router.put('/:imageId/annotations', async (req: Request, res: Response) => {
  const { annotations } = z.object({
    annotations: z.any(),
  }).parse(req.body);

  const existing = await prisma.dentalImage.findFirst({
    where: { id: req.params.imageId, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const image = await prisma.dentalImage.update({
    where: { id: req.params.imageId },
    data: { annotations },
  });

  res.json(image);
});

// Delete image
router.delete('/:imageId', async (req: Request, res: Response) => {
  const image = await prisma.dentalImage.findFirst({
    where: { id: req.params.imageId, patient: { practiceId: req.auth!.practiceId } },
  });

  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  deleteFile(resolveUploadPath(image.filePath));
  await prisma.dentalImage.delete({ where: { id: req.params.imageId } });

  res.json({ message: 'Image deleted' });
});

export default router;

// Separate router: serves the actual file bytes via a short-lived signed
// token instead of the Bearer-header `authenticate` middleware, since
// <img src>/<a href> can't attach an Authorization header. Mounted at
// /api/imaging/file in index.ts — kept out of the router above so it does
// NOT inherit `router.use(authenticate)`.
export const imagingFileRouter = Router();

const CONTENT_TYPES: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  tiff: 'image/tiff',
  dicom: 'application/dicom',
};

imagingFileRouter.get('/:imageId', async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  const verified = verifyFileAccessToken(token, req.params.imageId);
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired access token' });
    return;
  }

  const image = await prisma.dentalImage.findFirst({
    where: { id: req.params.imageId, patient: { practiceId: verified.practiceId } },
  });
  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const absolutePath = resolveUploadPath(image.filePath);
  if (!fs.existsSync(absolutePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const header = Buffer.alloc(132);
  const fd = fs.openSync(absolutePath, 'r');
  fs.readSync(fd, header, 0, 132, 0);
  fs.closeSync(fd);
  const kind = detectFileKind(header);

  // Content-Type is derived from the file's own signature, never the
  // client-supplied mimeType column, so a served file can't be reflected
  // back as something a browser would execute (e.g. text/html).
  res.setHeader('Content-Type', kind ? CONTENT_TYPES[kind] : 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(image.fileName)}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  fs.createReadStream(absolutePath).pipe(res);
});
