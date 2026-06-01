import { Router, Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { invalidateDashboardCache } from '../utils/cache';
import { generateInvoiceNumber } from '../utils/formatters';
import { generateInvoicePDF } from '../services/pdfGenerator';

const router = Router();
router.use(authenticate);

const createInvoiceSchema = z.object({
  patientId: z.string(),
  treatmentIds: z.array(z.string()).optional(),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  insurancePortion: z.number().min(0).optional(),
  notes: z.string().optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().min(0.01),
  method: z.enum(['CASH', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'FINANCING', 'OTHER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Billing summary
router.get('/summary', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [outstandingAgg, mtdRevenue, totalInvoiced, totalCollected] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { patientPortion: true },
      where: {
        patient: { practiceId },
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        invoice: { patient: { practiceId } },
        date: { gte: monthStart },
      },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { patient: { practiceId } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { invoice: { patient: { practiceId } } },
    }),
  ]);

  const totalInv = totalInvoiced._sum.total || 0;
  const totalCol = totalCollected._sum.amount || 0;
  const collectionRate = totalInv > 0 ? Math.round((totalCol / totalInv) * 10000) / 100 : 0;

  res.json({
    outstandingTotal: outstandingAgg._sum.patientPortion || 0,
    mtdRevenue: mtdRevenue._sum.amount || 0,
    collectionRate,
  });
});

// Overdue invoices
router.get('/overdue', async (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const now = new Date();

  const invoices = await prisma.invoice.findMany({
    where: {
      patient: { practiceId },
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      dueDate: { lt: now },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const result = invoices.map((inv) => {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    const balance = Math.round((inv.total - paid) * 100) / 100;
    const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patient: inv.patient,
      total: inv.total,
      paid,
      balance,
      dueDate: inv.dueDate,
      daysOverdue,
    };
  }).filter((inv) => inv.balance > 0);

  res.json({ invoices: result, total: result.length });
});

// List invoices
router.get('/invoices', async (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  const status = req.query.status as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

  const where: Record<string, unknown> = {
    patient: { practiceId: req.auth!.practiceId },
  };
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        payments: true,
        insuranceClaim: { select: { id: true, status: true, claimNumber: true } },
        _count: { select: { treatments: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.invoice.count({ where: where as any }),
  ]);

  res.json({ invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// Get single invoice
router.get('/invoices/:id', async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
    include: {
      patient: true,
      treatments: true,
      payments: true,
      insuranceClaim: true,
    },
  });

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  res.json(invoice);
});

// Download invoice as PDF
router.get('/invoices/:id/pdf', async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
    include: {
      patient: true,
      treatments: true,
    },
  });

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const practice = await prisma.practice.findUnique({
    where: { id: req.auth!.practiceId },
  });

  if (!practice) {
    res.status(404).json({ error: 'Practice not found' });
    return;
  }

  const outputPath = path.join(os.tmpdir(), `invoice-${invoice.invoiceNumber}.pdf`);

  await generateInvoicePDF(
    {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      dueDate: invoice.dueDate,
      practice: {
        name: practice.name,
        address: practice.address,
        phone: practice.phone,
        email: practice.email,
        npi: practice.npi,
      },
      patient: {
        firstName: invoice.patient.firstName,
        lastName: invoice.patient.lastName,
        address: invoice.patient.address,
        phone: invoice.patient.phone,
      },
      treatments: invoice.treatments.map((t) => ({
        cdtCode: t.cdtCode,
        description: t.description,
        toothNumber: t.toothNumber,
        fee: t.fee,
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      insurancePortion: invoice.insurancePortion,
      patientPortion: invoice.patientPortion,
    },
    outputPath,
  );

  res.download(outputPath, `invoice-${invoice.invoiceNumber}.pdf`, () => {
    fs.unlink(outputPath, () => {});
  });
});

// Void an invoice
router.post('/invoices/:id/void', async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, patient: { practiceId: req.auth!.practiceId } },
    include: { payments: true },
  });

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  if (invoice.payments.length > 0) {
    res.status(400).json({ error: 'Cannot void an invoice that has payments' });
    return;
  }

  const voided = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status: 'VOID' },
  });

  res.json(voided);
});

// Create invoice
router.post('/invoices', async (req: Request, res: Response) => {
  const data = createInvoiceSchema.parse(req.body);
  const discount = data.discount || 0;
  const taxAmount = data.taxAmount || 0;
  const insurancePortion = data.insurancePortion || 0;
  const total = data.subtotal - discount + taxAmount;
  const patientPortion = total - insurancePortion;

  const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Validate that treatments belong to the same patient and practice
  if (data.treatmentIds && data.treatmentIds.length > 0) {
    const validTreatments = await prisma.treatment.count({
      where: {
        id: { in: data.treatmentIds },
        patientId: data.patientId,
        patient: { practiceId: req.auth!.practiceId },
      },
    });
    if (validTreatments !== data.treatmentIds.length) {
      res.status(400).json({ error: 'One or more treatments do not belong to this patient' });
      return;
    }
  }

  const invoice = await prisma.invoice.create({
    data: {
      patientId: data.patientId,
      invoiceNumber: generateInvoiceNumber(),
      dueDate,
      subtotal: data.subtotal,
      taxAmount,
      discount,
      total,
      insurancePortion,
      patientPortion,
      notes: data.notes,
      ...(data.treatmentIds && data.treatmentIds.length > 0
        ? { treatments: { connect: data.treatmentIds.map((id) => ({ id })) } }
        : {}),
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      treatments: true,
    },
  });

  res.status(201).json(invoice);
});

// Record payment
router.post('/payments', async (req: Request, res: Response) => {
  const data = paymentSchema.parse(req.body);

  const payment = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: data.invoiceId, patient: { practiceId: req.auth!.practiceId } },
      include: { payments: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount;
    const newStatus = totalPaid >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';

    const newPayment = await tx.payment.create({ data });
    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: { status: newStatus },
    });

    return newPayment;
  });

  res.status(201).json(payment);
  invalidateDashboardCache(req.auth!.practiceId);
});

// Insurance claims
const claimSchema = z.object({
  invoiceId: z.string(),
  amountClaimed: z.number().min(0),
  preAuthNumber: z.string().optional(),
  notes: z.string().optional(),
});

router.post('/claims', async (req: Request, res: Response) => {
  const data = claimSchema.parse(req.body);

  const invoice = await prisma.invoice.findFirst({
    where: { id: data.invoiceId, patient: { practiceId: req.auth!.practiceId } },
  });
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  const claim = await prisma.insuranceClaim.create({
    data: {
      ...data,
      attachments: [],
    },
  });

  res.status(201).json(claim);
});

router.patch('/claims/:id/status', async (req: Request, res: Response) => {
  const { status, amountApproved, amountPaid, denialReason } = z.object({
    status: z.enum([
      'DRAFTED', 'SUBMITTED', 'IN_REVIEW', 'APPROVED',
      'PARTIALLY_APPROVED', 'DENIED', 'APPEALED', 'PAID', 'WRITE_OFF',
    ]),
    amountApproved: z.number().optional(),
    amountPaid: z.number().optional(),
    denialReason: z.string().optional(),
  }).parse(req.body);

  const claim = await prisma.insuranceClaim.findFirst({
    where: { id: req.params.id, invoice: { patient: { practiceId: req.auth!.practiceId } } },
  });
  if (!claim) {
    res.status(404).json({ error: 'Claim not found' });
    return;
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'SUBMITTED') updateData.submittedAt = new Date();
  if (status === 'PAID') updateData.paidAt = new Date();
  if (amountApproved !== undefined) updateData.amountApproved = amountApproved;
  if (amountPaid !== undefined) updateData.amountPaid = amountPaid;
  if (denialReason) updateData.denialReason = denialReason;

  const updatedClaim = await prisma.insuranceClaim.update({
    where: { id: req.params.id },
    data: updateData as any,
  });

  res.json(updatedClaim);
});

// Patient ledger (paginated with aggregated summary)
router.get('/ledger/:patientId', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.patientId, practiceId: req.auth!.practiceId },
  });
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  const [invoices, total, chargesAgg, paymentsAgg] = await Promise.all([
    prisma.invoice.findMany({
      where: { patientId: req.params.patientId },
      include: {
        treatments: { select: { cdtCode: true, description: true, fee: true } },
        payments: true,
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where: { patientId: req.params.patientId } }),
    prisma.invoice.aggregate({
      where: { patientId: req.params.patientId },
      _sum: { total: true },
    }),
    prisma.payment.aggregate({
      where: { invoice: { patientId: req.params.patientId } },
      _sum: { amount: true },
    }),
  ]);

  const totalCharges = chargesAgg._sum.total || 0;
  const totalPayments = paymentsAgg._sum.amount || 0;
  const balance = Math.round((totalCharges - totalPayments) * 100) / 100;

  res.json({
    invoices,
    summary: { totalCharges, totalPayments, balance },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Fee schedule
router.get('/fee-schedule', async (req: Request, res: Response) => {
  const fees = await prisma.feeScheduleItem.findMany({
    where: { practiceId: req.auth!.practiceId },
    orderBy: { cdtCode: 'asc' },
  });

  res.json(fees);
});

router.put('/fee-schedule', async (req: Request, res: Response) => {
  const feeSchema = z.object({
    items: z.array(z.object({
      cdtCode: z.string(),
      description: z.string(),
      fee: z.number().min(0),
      category: z.string(),
    })),
  });

  const { items } = feeSchema.parse(req.body);

  const results = await prisma.$transaction(
    items.map((item) =>
      prisma.feeScheduleItem.upsert({
        where: {
          practiceId_cdtCode: {
            practiceId: req.auth!.practiceId,
            cdtCode: item.cdtCode,
          },
        },
        create: { ...item, practiceId: req.auth!.practiceId },
        update: { description: item.description, fee: item.fee, category: item.category },
      })
    )
  );

  res.json(results);
});

export default router;
