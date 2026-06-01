import { prisma } from '../config/database';

export interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dateOfBirth: Date;
  status: string;
}

export interface AppointmentSearchResult {
  id: string;
  startTime: Date;
  endTime: Date;
  type: string;
  status: string;
  reason: string | null;
  notes: string | null;
  patient: { id: string; firstName: string; lastName: string };
  provider: { id: string; name: string };
}

export interface UnifiedSearchResults {
  patients: PatientSearchResult[];
  appointments: AppointmentSearchResult[];
}

/**
 * Search patients by name, email, phone, or date of birth.
 */
export async function searchPatients(
  query: string,
  practiceId: string,
  limit: number = 20
): Promise<PatientSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Attempt to parse as a date for DOB search
  const dateFilter = parseDateQuery(trimmed);

  const patients = await prisma.patient.findMany({
    where: {
      practiceId,
      OR: [
        { firstName: { contains: trimmed, mode: 'insensitive' } },
        { lastName: { contains: trimmed, mode: 'insensitive' } },
        { email: { contains: trimmed, mode: 'insensitive' } },
        { phone: { startsWith: trimmed } },
        ...(dateFilter ? [{ dateOfBirth: dateFilter }] : []),
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
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: limit,
  });

  return patients;
}

/**
 * Search appointments by patient name or notes.
 */
export async function searchAppointments(
  query: string,
  practiceId: string,
  limit: number = 20
): Promise<AppointmentSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const appointments = await prisma.appointment.findMany({
    where: {
      provider: { practiceId },
      OR: [
        { patient: { firstName: { contains: trimmed, mode: 'insensitive' } } },
        { patient: { lastName: { contains: trimmed, mode: 'insensitive' } } },
        { notes: { contains: trimmed, mode: 'insensitive' } },
        { reason: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      type: true,
      status: true,
      reason: true,
      notes: true,
      patient: { select: { id: true, firstName: true, lastName: true } },
      provider: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'desc' },
    take: limit,
  });

  return appointments;
}

/**
 * Unified search returning categorized results across patients and appointments.
 */
export async function searchAll(
  query: string,
  practiceId: string
): Promise<UnifiedSearchResults> {
  const [patients, appointments] = await Promise.all([
    searchPatients(query, practiceId, 10),
    searchAppointments(query, practiceId, 10),
  ]);

  return { patients, appointments };
}

/**
 * Try to parse a query string as a date for DOB matching.
 * Returns a Prisma date filter or null if parsing fails.
 */
function parseDateQuery(query: string): { gte: Date; lt: Date } | null {
  // Accept YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY
  const isoMatch = query.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const usMatch = query.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  let year: number, month: number, day: number;

  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else if (usMatch) {
    month = parseInt(usMatch[1], 10);
    day = parseInt(usMatch[2], 10);
    year = parseInt(usMatch[3], 10);
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const gte = new Date(year, month - 1, day);
  const lt = new Date(year, month - 1, day + 1);

  if (isNaN(gte.getTime())) return null;

  return { gte, lt };
}
