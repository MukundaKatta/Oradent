import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['patient', 'appointment', 'invoice', 'all']).default('all'),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(50, Math.max(1, parseInt(v || '10')))),
});

// ─── Global search ───

router.get('/', async (req: Request, res: Response) => {
  const { q, type, limit } = searchQuerySchema.parse(req.query);
  const practiceId = req.auth!.practiceId;

  const results: {
    patients: unknown[];
    appointments: unknown[];
    invoices: unknown[];
  } = {
    patients: [],
    appointments: [],
    invoices: [],
  };

  // Search patients
  if (type === 'patient' || type === 'all') {
    const patients = await prisma.patient.findMany({
      where: {
        practiceId,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        status: true,
      },
      take: limit,
      orderBy: { lastName: 'asc' },
    });

    results.patients = patients.map((p) => ({
      ...p,
      _type: 'patient' as const,
      _score: computePatientScore(p, q),
    }));
  }

  // Search appointments
  if (type === 'appointment' || type === 'all') {
    const appointments = await prisma.appointment.findMany({
      where: {
        provider: { practiceId },
        OR: [
          { reason: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
          { patient: { firstName: { contains: q, mode: 'insensitive' } } },
          { patient: { lastName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        type: true,
        status: true,
        reason: true,
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        provider: {
          select: { id: true, name: true },
        },
      },
      take: limit,
      orderBy: { startTime: 'desc' },
    });

    results.appointments = appointments.map((a) => ({
      ...a,
      _type: 'appointment' as const,
      _score: computeAppointmentScore(a, q),
    }));
  }

  // Search invoices
  if (type === 'invoice' || type === 'all') {
    const invoices = await prisma.invoice.findMany({
      where: {
        patient: { practiceId },
        OR: [
          { invoiceNumber: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
          { patient: { firstName: { contains: q, mode: 'insensitive' } } },
          { patient: { lastName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        date: true,
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      take: limit,
      orderBy: { date: 'desc' },
    });

    results.invoices = invoices.map((inv) => ({
      ...inv,
      _type: 'invoice' as const,
      _score: computeInvoiceScore(inv, q),
    }));
  }

  const totalResults =
    results.patients.length + results.appointments.length + results.invoices.length;

  res.json({
    query: q,
    type,
    totalResults,
    results,
  });
});

// ─── Scoring helpers ───

function computePatientScore(
  patient: { firstName: string; lastName: string; email: string | null; phone: string },
  query: string
): number {
  const q = query.toLowerCase();
  let score = 0;
  if (patient.lastName.toLowerCase().startsWith(q)) score += 10;
  else if (patient.lastName.toLowerCase().includes(q)) score += 5;
  if (patient.firstName.toLowerCase().startsWith(q)) score += 8;
  else if (patient.firstName.toLowerCase().includes(q)) score += 4;
  if (patient.email?.toLowerCase().includes(q)) score += 3;
  if (patient.phone.includes(query)) score += 3;
  return score;
}

function computeAppointmentScore(
  appointment: { reason: string | null; patient: { firstName: string; lastName: string } },
  query: string
): number {
  const q = query.toLowerCase();
  let score = 0;
  if (appointment.reason?.toLowerCase().includes(q)) score += 5;
  if (appointment.patient.lastName.toLowerCase().startsWith(q)) score += 8;
  else if (appointment.patient.lastName.toLowerCase().includes(q)) score += 4;
  if (appointment.patient.firstName.toLowerCase().includes(q)) score += 3;
  return score;
}

function computeInvoiceScore(
  invoice: {
    invoiceNumber: string;
    notes?: string | null;
    patient: { firstName: string; lastName: string };
  },
  query: string
): number {
  const q = query.toLowerCase();
  let score = 0;
  if (invoice.invoiceNumber.toLowerCase() === q) score += 10;
  else if (invoice.invoiceNumber.toLowerCase().startsWith(q)) score += 8;
  else if (invoice.invoiceNumber.toLowerCase().includes(q)) score += 4;
  if (invoice.patient.lastName.toLowerCase().includes(q)) score += 3;
  if (invoice.patient.firstName.toLowerCase().includes(q)) score += 2;
  return score;
}

export default router;
