import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  practice: { name: string; address: string; phone: string; email: string; npi?: string | null };
  patient: { firstName: string; lastName: string; address?: string | null; phone: string };
  treatments: Array<{ cdtCode: string; description: string; toothNumber?: number | null; fee: number }>;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  insurancePortion: number;
  patientPortion: number;
}

export async function generateInvoicePDF(data: InvoiceData, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Header
    doc.fontSize(24).fillColor('#0d9488').text(data.practice.name, 50, 50);
    doc.fontSize(10).fillColor('#57534e')
      .text(data.practice.address, 50, 80)
      .text(`Phone: ${data.practice.phone} | Email: ${data.practice.email}`, 50, 95);

    if (data.practice.npi) {
      doc.text(`NPI: ${data.practice.npi}`, 50, 110);
    }

    // Invoice title
    doc.fontSize(18).fillColor('#1c1917').text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#57534e')
      .text(`Invoice #: ${data.invoiceNumber}`, 400, 75, { align: 'right' })
      .text(`Date: ${formatDate(data.date)}`, 400, 90, { align: 'right' })
      .text(`Due: ${formatDate(data.dueDate)}`, 400, 105, { align: 'right' });

    // Divider
    doc.moveTo(50, 135).lineTo(562, 135).strokeColor('#e7e5e4').stroke();

    // Patient info
    doc.fontSize(12).fillColor('#1c1917').text('Bill To:', 50, 150);
    doc.fontSize(10).fillColor('#57534e')
      .text(`${data.patient.firstName} ${data.patient.lastName}`, 50, 168)
      .text(data.patient.address || '', 50, 183)
      .text(`Phone: ${data.patient.phone}`, 50, 198);

    // Items table header
    const tableTop = 240;
    doc.fontSize(9).fillColor('#1c1917');
    doc.rect(50, tableTop, 512, 20).fill('#f5f5f4');
    doc.fillColor('#1c1917')
      .text('CDT Code', 55, tableTop + 5)
      .text('Description', 130, tableTop + 5)
      .text('Tooth', 370, tableTop + 5)
      .text('Fee', 430, tableTop + 5, { width: 127, align: 'right' });

    // Items
    let y = tableTop + 25;
    for (const item of data.treatments) {
      doc.fillColor('#57534e')
        .text(item.cdtCode, 55, y)
        .text(item.description, 130, y, { width: 230 })
        .text(item.toothNumber ? `#${item.toothNumber}` : '-', 370, y)
        .text(formatCurrency(item.fee), 430, y, { width: 127, align: 'right' });
      y += 20;
    }

    // Totals
    y += 10;
    doc.moveTo(350, y).lineTo(562, y).strokeColor('#e7e5e4').stroke();
    y += 10;

    doc.fillColor('#57534e')
      .text('Subtotal:', 350, y).text(formatCurrency(data.subtotal), 430, y, { width: 127, align: 'right' });
    y += 18;

    if (data.discount > 0) {
      doc.text('Discount:', 350, y).text(`-${formatCurrency(data.discount)}`, 430, y, { width: 127, align: 'right' });
      y += 18;
    }

    if (data.taxAmount > 0) {
      doc.text('Tax:', 350, y).text(formatCurrency(data.taxAmount), 430, y, { width: 127, align: 'right' });
      y += 18;
    }

    doc.fontSize(12).fillColor('#1c1917')
      .text('Total:', 350, y).text(formatCurrency(data.total), 430, y, { width: 127, align: 'right' });
    y += 22;

    doc.fontSize(10).fillColor('#57534e')
      .text('Insurance Estimate:', 350, y).text(formatCurrency(data.insurancePortion), 430, y, { width: 127, align: 'right' });
    y += 18;

    doc.fontSize(11).fillColor('#0d9488')
      .text('Patient Responsibility:', 350, y).text(formatCurrency(data.patientPortion), 430, y, { width: 127, align: 'right' });

    // Footer
    doc.fontSize(8).fillColor('#a8a29e')
      .text('Thank you for choosing ' + data.practice.name, 50, 700, { align: 'center' })
      .text('Please remit payment by the due date shown above.', 50, 712, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}
