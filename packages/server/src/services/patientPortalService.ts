import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface AppointmentRequestData {
  preferredDate: string;
  preferredTime: string;
  type: string;
  reason?: string;
  notes?: string;
}

export interface PatientMessage {
  id: string;
  patientId: string;
  subject: string;
  body: string;
  direction: 'inbound' | 'outbound';
  read: boolean;
  createdAt: Date;
}

// In-memory stores (placeholders until dedicated tables are added)
const appointmentRequests: Array<{
  id: string;
  patientId: string;
  data: AppointmentRequestData;
  status: 'pending' | 'approved' | 'declined';
  createdAt: Date;
}> = [];

const patientMessages: PatientMessage[] = [];

let requestCounter = 0;
let messageCounter = 0;

/**
 * Build a dashboard summary for a patient: upcoming appointments, balance, recent treatments.
 */
export async function getPatientDashboard(patientId: string) {
  const now = new Date();

  const [upcomingAppointments, recentTreatments, invoices] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId,
        startTime: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        provider: { select: { name: true, title: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
    prisma.treatment.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        id: true,
        date: true,
        cdtCode: true,
        description: true,
        fee: true,
        status: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        patientId,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      select: { id: true, total: true, patientPortion: true, status: true },
    }),
  ]);

  const outstandingBalance = invoices.reduce(
    (sum, inv) => sum + inv.patientPortion,
    0,
  );

  return {
    upcomingAppointments,
    recentTreatments,
    outstandingBalance,
    openInvoices: invoices,
  };
}

/**
 * Submit an appointment request on behalf of a patient.
 */
export function submitAppointmentRequest(
  patientId: string,
  data: AppointmentRequestData,
) {
  requestCounter += 1;
  const request = {
    id: `req_${requestCounter}`,
    patientId,
    data,
    status: 'pending' as const,
    createdAt: new Date(),
  };

  appointmentRequests.push(request);
  logger.info({ patientId, requestId: request.id }, 'Appointment request submitted');
  return request;
}

/**
 * List documents / forms associated with a patient (placeholder).
 */
export async function getPatientDocuments(patientId: string) {
  // Query dental images as a proxy for documents until a dedicated documents table exists
  const images = await prisma.dentalImage.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      type: true,
      createdAt: true,
    },
  });

  return images;
}

/**
 * List messages for a patient.
 */
export function getPatientMessages(patientId: string): PatientMessage[] {
  return patientMessages.filter((m) => m.patientId === patientId);
}

/**
 * Create a new message for a patient.
 */
export function createPatientMessage(
  patientId: string,
  subject: string,
  body: string,
  direction: 'inbound' | 'outbound',
): PatientMessage {
  messageCounter += 1;
  const message: PatientMessage = {
    id: `msg_${messageCounter}`,
    patientId,
    subject,
    body,
    direction,
    read: false,
    createdAt: new Date(),
  };

  patientMessages.push(message);
  logger.info({ patientId, messageId: message.id, direction }, 'Patient message created');
  return message;
}
