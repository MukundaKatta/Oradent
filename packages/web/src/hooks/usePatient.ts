import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/lib/api';

// Mirrors packages/server/prisma/schema.prisma's MedicalHistory model.
export interface MedicalHistory {
  id: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  bloodType?: string | null;
  isPregnant: boolean;
  smokingStatus?: string | null;
  alcoholUse?: string | null;
  previousSurgeries: string[];
  familyHistory: string[];
  lastPhysical?: string | null;
  notes?: string | null;
  updatedAt: string;
}

// Mirrors InsuranceInfo. The list endpoint only selects {company, memberId};
// the detail endpoint includes the full row — everything else is optional
// so both shapes satisfy this type.
export interface PatientInsuranceInfo {
  id?: string;
  company: string;
  planName?: string | null;
  groupNumber?: string | null;
  memberId: string;
  subscriberName?: string;
  subscriberDob?: string | null;
  relationship?: string;
  effectiveDate?: string | null;
  expirationDate?: string | null;
  annualMax?: number | null;
  remainingBenefit?: number | null;
  deductible?: number | null;
  deductibleMet?: number;
  coveragePercent?: Record<string, number>;
  verifiedAt?: string | null;
  notes?: string | null;
}

export interface PatientCounts {
  appointments: number;
  treatments: number;
  images?: number;
  invoices?: number;
}

// Mirrors GET /api/patients (list, lighter include) and GET /api/patients/:id
// (detail, fuller include) in packages/server/src/routes/patients.ts. Fields
// only present on the detail response are optional.
export interface Patient {
  id: string;
  practiceId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string | null;
  email?: string | null;
  phone: string;
  phoneSecondary?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  lastVisit?: string | null;
  nextAppointment?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  medicalHistory?: MedicalHistory | null;
  insurancePrimary?: PatientInsuranceInfo | null;
  insuranceSecondary?: PatientInsuranceInfo | null;
  _count?: PatientCounts;
}

export interface PatientListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Mirrors createPatientSchema in packages/server/src/routes/patients.ts —
// intentionally its own type rather than derived from Patient, since the
// create endpoint accepts a materially smaller set of fields (no insurance,
// no medical history, no status).
export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  email?: string;
  phone: string;
  phoneSecondary?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  notes?: string;
}

export type UpdatePatientInput = Partial<CreatePatientInput>;

export function usePatients(params: PatientListParams = {}) {
  const queryString = new URLSearchParams();
  if (params.search) queryString.set('search', params.search);
  if (params.status) queryString.set('status', params.status);
  if (params.page) queryString.set('page', String(params.page));
  if (params.limit) queryString.set('limit', String(params.limit));
  if (params.sortBy) queryString.set('sortBy', params.sortBy);
  if (params.sortOrder) queryString.set('sortOrder', params.sortOrder);

  return useQuery<PatientListResponse>({
    queryKey: ['patients', params],
    queryFn: () => apiGet<PatientListResponse>(`/api/patients?${queryString.toString()}`),
  });
}

export function usePatient(id: string | undefined) {
  return useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: () => apiGet<Patient>(`/api/patients/${id}`),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientInput) =>
      apiPost<Patient, CreatePatientInput>('/api/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientInput) =>
      apiPut<Patient, UpdatePatientInput>(`/api/patients/${id}`, data),
    onSuccess: (updatedPatient) => {
      queryClient.setQueryData(['patient', id], updatedPatient);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
