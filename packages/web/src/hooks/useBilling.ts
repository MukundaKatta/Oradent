import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

// Mirrors packages/server/src/routes/billing.ts and prisma/schema.prisma's
// Invoice/Payment/InsuranceClaim models.

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID' | 'WRITE_OFF';
export type PaymentMethod = 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'FINANCING' | 'OTHER';
export type ClaimStatus =
  | 'DRAFTED' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED'
  | 'PARTIALLY_APPROVED' | 'DENIED' | 'APPEALED' | 'PAID' | 'WRITE_OFF';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  date: string;
  notes?: string | null;
}

export interface InsuranceClaimSummary {
  id: string;
  status: ClaimStatus;
  claimNumber: string | null;
}

// The list endpoint (GET /invoices) and detail endpoint (GET /invoices/:id)
// use different includes for `patient` — list only selects id/first/last
// name, detail includes the full Patient row. Both satisfy this type since
// the extra detail fields are optional.
export interface Invoice {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  invoiceNumber: string;
  date: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  insurancePortion: number;
  patientPortion: number;
  status: InvoiceStatus;
  payments: Payment[];
  insuranceClaim?: InsuranceClaimSummary | null;
  notes?: string | null;
  pdfPath?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { treatments: number };
}

export interface InvoiceListParams {
  patientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// Mirrors GET /api/billing/ledger/:patientId — the pre-aggregated view the
// billing page should use instead of summing invoices/payments client-side.
export interface PatientLedgerResponse {
  invoices: Invoice[];
  summary: { totalCharges: number; totalPayments: number; balance: number };
  pagination: { page: number; limit: number; total: number; pages: number };
}

export type CreateInvoiceInput = {
  patientId: string;
  treatmentIds?: string[];
  subtotal: number;
  taxAmount?: number;
  discount?: number;
  insurancePortion?: number;
  notes?: string;
  dueDate?: string;
};

export type RecordPaymentInput = {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
};

export function useInvoices(params: InvoiceListParams = {}) {
  const queryString = new URLSearchParams();
  if (params.patientId) queryString.set('patientId', params.patientId);
  if (params.status) queryString.set('status', params.status);
  if (params.page) queryString.set('page', String(params.page));
  if (params.limit) queryString.set('limit', String(params.limit));

  return useQuery<InvoiceListResponse>({
    queryKey: ['invoices', params],
    queryFn: () => apiGet<InvoiceListResponse>(`/api/billing/invoices?${queryString.toString()}`),
  });
}

export function usePatientLedger(patientId: string | undefined) {
  return useQuery<PatientLedgerResponse>({
    queryKey: ['patientLedger', patientId],
    queryFn: () => apiGet<PatientLedgerResponse>(`/api/billing/ledger/${patientId}`),
    enabled: !!patientId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) =>
      apiPost<Invoice, CreateInvoiceInput>('/api/billing/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['patientLedger'] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentInput) =>
      apiPost<Payment, RecordPaymentInput>('/api/billing/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['patientLedger'] });
    },
  });
}
