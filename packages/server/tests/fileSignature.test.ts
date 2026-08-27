import { describe, it, expect } from 'vitest';
import { detectFileKind } from '../src/utils/fileSignature';

function bytes(...values: number[]): Buffer {
  return Buffer.from(values);
}

describe('detectFileKind', () => {
  it('detects a JPEG signature', () => {
    expect(detectFileKind(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe('jpeg');
  });

  it('detects a PNG signature', () => {
    expect(detectFileKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
  });

  it('detects little-endian and big-endian TIFF signatures', () => {
    expect(detectFileKind(bytes(0x49, 0x49, 0x2a, 0x00))).toBe('tiff');
    expect(detectFileKind(bytes(0x4d, 0x4d, 0x00, 0x2a))).toBe('tiff');
  });

  it('detects DICOM by its 128-byte preamble + DICM magic', () => {
    const buf = Buffer.alloc(132);
    buf.write('DICM', 128, 'ascii');
    expect(detectFileKind(buf)).toBe('dicom');
  });

  it('rejects an SVG carrying a script payload disguised with an image mimetype', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(detectFileKind(svg)).toBeNull();
  });

  it('rejects plain text and empty buffers', () => {
    expect(detectFileKind(Buffer.from('hello world'))).toBeNull();
    expect(detectFileKind(Buffer.alloc(0))).toBeNull();
  });
});
