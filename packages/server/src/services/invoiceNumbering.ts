import type { PrismaClient } from '@prisma/client';

// Invoice numbers used to be INV-YYYYMM-<4 random digits> (utils/formatters.ts).
// With ~118 invoices in a single month the birthday paradox puts collision
// odds over 50%, and invoiceNumber is @unique, so creation would fail with a
// 409 and no retry. A Postgres sequence guarantees no collision regardless
// of volume; the date prefix is kept for human readability only.
export async function generateInvoiceNumber(prisma: PrismaClient): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const [{ nextval }] = await prisma.$queryRaw<{ nextval: bigint }[]>`
    SELECT nextval('invoice_number_seq') AS nextval
  `;

  return `INV-${year}${month}-${nextval.toString().padStart(6, '0')}`;
}
