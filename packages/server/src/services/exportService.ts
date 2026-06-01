import { prisma } from '../config/database';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PatientListFilters {
  status?: string;
  lastVisitAfter?: Date;
  lastVisitBefore?: Date;
}

/**
 * Escape and quote a value for safe CSV output.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Build a CSV string from rows and column definitions.
 */
function buildCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; header: string }[]
): string {
  const header = columns.map((c) => csvEscape(c.header)).join(',');
  const dataRows = rows.map((row) =>
    columns.map((c) => csvEscape(row[c.key])).join(',')
  );
  return [header, ...dataRows].join('\n');
}

/**
 * Export a list of patients as CSV.
 */
export async function exportPatientList(
  practiceId: string,
  filters: PatientListFilters = {}
): Promise<string> {
  const where: Record<string, unknown> = { practiceId };
  if (filters.status) where.status = filters.status;
  if (filters.lastVisitAfter || filters.lastVisitBefore) {
    const lastVisit: Record<string, Date> = {};
    if (filters.lastVisitAfter) lastVisit.gte = filters.lastVisitAfter;
    if (filters.lastVisitBefore) lastVisit.lte = filters.lastVisitBefore;
    where.lastVisit = lastVisit;
  }

  const patients = await prisma.patient.findMany({
    where: where as any,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      status: true,
      lastVisit: true,
      createdAt: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  const rows = patients.map((p) => ({
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth.toISOString().split('T')[0],
    gender: p.gender ?? '',
    email: p.email ?? '',
    phone: p.phone,
    address: p.address ?? '',
    city: p.city ?? '',
    state: p.state ?? '',
    zipCode: p.zipCode ?? '',
    status: p.status,
    lastVisit: p.lastVisit ? p.lastVisit.toISOString().split('T')[0] : '',
    createdAt: p.createdAt.toISOString().split('T')[0],
  }));

  return buildCsv(rows, [
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'dateOfBirth', header: 'Date of Birth' },
    { key: 'gender', header: 'Gender' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'address', header: 'Address' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'zipCode', header: 'Zip Code' },
    { key: 'status', header: 'Status' },
    { key: 'lastVisit', header: 'Last Visit' },
    { key: 'createdAt', header: 'Created' },
  ]);
}

/**
 * Export appointment data for a date range as CSV.
 */
export async function exportAppointmentReport(
  practiceId: string,
  dateRange: DateRange
): Promise<string> {
  const appointments = await prisma.appointment.findMany({
    where: {
      provider: { practiceId },
      startTime: { gte: dateRange.start, lte: dateRange.end },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      duration: true,
      type: true,
      status: true,
      reason: true,
      notes: true,
      patient: { select: { firstName: true, lastName: true } },
      provider: { select: { name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const rows = appointments.map((a) => ({
    date: a.startTime.toISOString().split('T')[0],
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    duration: a.duration,
    patient: `${a.patient.lastName}, ${a.patient.firstName}`,
    provider: a.provider.name,
    type: a.type,
    status: a.status,
    reason: a.reason ?? '',
    notes: a.notes ?? '',
  }));

  return buildCsv(rows, [
    { key: 'date', header: 'Date' },
    { key: 'startTime', header: 'Start Time' },
    { key: 'endTime', header: 'End Time' },
    { key: 'duration', header: 'Duration (min)' },
    { key: 'patient', header: 'Patient' },
    { key: 'provider', header: 'Provider' },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'reason', header: 'Reason' },
    { key: 'notes', header: 'Notes' },
  ]);
}

/**
 * Export billing (invoice) data for a date range as CSV.
 */
export async function exportBillingReport(
  practiceId: string,
  dateRange: DateRange
): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: {
      patient: { practiceId },
      date: { gte: dateRange.start, lte: dateRange.end },
    },
    select: {
      invoiceNumber: true,
      date: true,
      dueDate: true,
      subtotal: true,
      taxAmount: true,
      discount: true,
      total: true,
      insurancePortion: true,
      patientPortion: true,
      status: true,
      patient: { select: { firstName: true, lastName: true } },
      payments: { select: { amount: true, method: true, date: true } },
    },
    orderBy: { date: 'asc' },
  });

  const rows = invoices.map((inv) => {
    const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      invoiceNumber: inv.invoiceNumber,
      date: inv.date.toISOString().split('T')[0],
      dueDate: inv.dueDate.toISOString().split('T')[0],
      patient: `${inv.patient.lastName}, ${inv.patient.firstName}`,
      subtotal: inv.subtotal.toFixed(2),
      tax: inv.taxAmount.toFixed(2),
      discount: inv.discount.toFixed(2),
      total: inv.total.toFixed(2),
      insurancePortion: inv.insurancePortion.toFixed(2),
      patientPortion: inv.patientPortion.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      balance: (inv.total - totalPaid).toFixed(2),
      status: inv.status,
    };
  });

  return buildCsv(rows, [
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'date', header: 'Date' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'patient', header: 'Patient' },
    { key: 'subtotal', header: 'Subtotal' },
    { key: 'tax', header: 'Tax' },
    { key: 'discount', header: 'Discount' },
    { key: 'total', header: 'Total' },
    { key: 'insurancePortion', header: 'Insurance Portion' },
    { key: 'patientPortion', header: 'Patient Portion' },
    { key: 'totalPaid', header: 'Total Paid' },
    { key: 'balance', header: 'Balance' },
    { key: 'status', header: 'Status' },
  ]);
}

/**
 * Export treatment data for a date range as CSV.
 */
export async function exportTreatmentReport(
  practiceId: string,
  dateRange: DateRange
): Promise<string> {
  const treatments = await prisma.treatment.findMany({
    where: {
      provider: { practiceId },
      date: { gte: dateRange.start, lte: dateRange.end },
    },
    select: {
      date: true,
      cdtCode: true,
      description: true,
      toothNumber: true,
      surfaces: true,
      fee: true,
      status: true,
      notes: true,
      patient: { select: { firstName: true, lastName: true } },
      provider: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  });

  const rows = treatments.map((t) => ({
    date: t.date.toISOString().split('T')[0],
    patient: `${t.patient.lastName}, ${t.patient.firstName}`,
    provider: t.provider.name,
    cdtCode: t.cdtCode,
    description: t.description,
    toothNumber: t.toothNumber ?? '',
    surfaces: t.surfaces.join(','),
    fee: t.fee.toFixed(2),
    status: t.status,
    notes: t.notes ?? '',
  }));

  return buildCsv(rows, [
    { key: 'date', header: 'Date' },
    { key: 'patient', header: 'Patient' },
    { key: 'provider', header: 'Provider' },
    { key: 'cdtCode', header: 'CDT Code' },
    { key: 'description', header: 'Description' },
    { key: 'toothNumber', header: 'Tooth #' },
    { key: 'surfaces', header: 'Surfaces' },
    { key: 'fee', header: 'Fee' },
    { key: 'status', header: 'Status' },
    { key: 'notes', header: 'Notes' },
  ]);
}
