// Multer's fileFilter only sees the client-supplied mimetype/extension
// (headers), not the actual bytes — a renamed .svg with an embedded
// <script> would sail through as "image/svg+xml sniffed as image/*" and
// then get served back from the API's own origin, a stored-XSS vector.
// This checks the real file signature after upload, for the formats this
// app actually accepts (dental X-rays are commonly JPEG/PNG/TIFF/DICOM).

export type DetectedFileKind = 'jpeg' | 'png' | 'tiff' | 'dicom';

function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buf[offset + i] === b);
}

export function detectFileKind(buf: Buffer): DetectedFileKind | null {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buf, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buf, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff';
  // DICOM: 128-byte preamble (usually zeroed) followed by the "DICM" magic.
  if (buf.length >= 132 && buf.subarray(128, 132).toString('ascii') === 'DICM') return 'dicom';
  return null;
}
