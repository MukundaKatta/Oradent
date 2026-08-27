import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

// Mirrors GET /api/treatments/:patientId in
// packages/server/src/routes/treatments.ts and the Treatment model —
// completed/recorded procedures, not TreatmentPlan/TreatmentPlanItem (the
// proposed-plan model used by the treatments tab's plan list).
export interface Treatment {
  id: string;
  patientId: string;
  providerId: string;
  provider?: { id: string; name: string; title?: string };
  date: string;
  toothNumber: number | null;
  surfaces: string[];
  cdtCode: string;
  description: string;
  diagnosisCodes: string[];
  fee: number;
  notes: string | null;
  status: string;
  // Set once the treatment has been attached to an invoice — see
  // POST /api/billing/invoices, which accepts a treatmentIds array.
  invoiceId: string | null;
  createdAt: string;
}

export function useTreatments(patientId: string | undefined) {
  return useQuery<Treatment[]>({
    queryKey: ['treatments', patientId],
    queryFn: () => apiGet<Treatment[]>(`/api/treatments/${patientId}`),
    enabled: !!patientId,
  });
}
