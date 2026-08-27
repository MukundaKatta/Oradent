import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadDir, ensureUploadDir } from '../config/storage';

ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/dicom', 'application/dicom'];

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // The claimed mimetype is client-controlled and only a first-pass filter —
  // the real content is verified after upload via utils/fileSignature.ts.
  // Deliberately no `startsWith('image/')` fallback: that previously let
  // image/svg+xml through, and an SVG can carry an embedded <script>,
  // served back from this API's own origin.
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, TIFF, or DICOM files are allowed'));
  }
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
