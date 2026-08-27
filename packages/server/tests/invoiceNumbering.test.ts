import { describe, it, expect, vi } from 'vitest';
import { generateInvoiceNumber } from '../src/services/invoiceNumbering';

function mockPrisma(nextval: bigint) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ nextval }]),
  } as unknown as import('@prisma/client').PrismaClient;
}

describe('generateInvoiceNumber', () => {
  it('formats the sequence value into INV-YYYYMM-NNNNNN', async () => {
    const number = await generateInvoiceNumber(mockPrisma(42n));
    expect(number).toMatch(/^INV-\d{6}-000042$/);
  });

  it('never collides for distinct sequence values (unlike the old random suffix)', async () => {
    const numbers = await Promise.all(
      Array.from({ length: 200 }, (_, i) => generateInvoiceNumber(mockPrisma(BigInt(i))))
    );
    expect(new Set(numbers).size).toBe(200);
  });

  it('pads large sequence values without truncating', async () => {
    const number = await generateInvoiceNumber(mockPrisma(1234567n));
    expect(number).toMatch(/^INV-\d{6}-1234567$/);
  });
});
