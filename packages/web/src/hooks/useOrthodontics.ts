import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

// Mirrors packages/server/src/routes/orthodontics.ts and prisma/schema.prisma's
// OrthodonticCase / OrthodonticVisit models + enums.

export type OrthodonticApplianceType =
  | 'FIXED_METAL' | 'FIXED_CERAMIC' | 'LINGUAL' | 'ALIGNER' | 'RETAINER';

export type OrthodonticCaseStatus =
  | 'ACTIVE' | 'RETENTION' | 'COMPLETED' | 'DISCONTINUED';

export interface OrthodonticCase {
  id: string;
  patientId: string;
  providerId: string;
  applianceType: OrthodonticApplianceType;
  status: OrthodonticCaseStatus;
  startDate: string;
  estimatedEndDate: string | null;
  totalAlignerSteps: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrthodonticVisit {
  id: string;
  caseId: string;
  appointmentId: string | null;
  date: string;
  wireChanged: boolean;
  wireStrength: string | null;
  elasticsUsed: string | null;
  alignerStepNumber: number | null;
  notes: string | null;
  nextVisitDate: string | null;
  treatmentId: string | null;
  createdAt: string;
}

export function useOrthodonticCases(patientId: string | undefined) {
  return useQuery<OrthodonticCase[]>({
    queryKey: ['orthodonticCases', patientId],
    queryFn: () => apiGet<OrthodonticCase[]>(`/api/orthodontics/cases/${patientId}`),
    enabled: !!patientId,
  });
}

export type CreateOrthodonticCaseInput = {
  patientId: string;
  applianceType: OrthodonticApplianceType;
  startDate: string;
  estimatedEndDate?: string;
  totalAlignerSteps?: number;
  notes?: string;
};

export function useCreateOrthodonticCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrthodonticCaseInput) =>
      apiPost<OrthodonticCase, CreateOrthodonticCaseInput>('/api/orthodontics/cases', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orthodonticCases', variables.patientId] });
    },
  });
}

export function useUpdateOrthodonticCaseStatus(caseId: string, patientId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: OrthodonticCaseStatus) =>
      apiPatch<OrthodonticCase, { status: OrthodonticCaseStatus }>(
        `/api/orthodontics/cases/${caseId}`,
        { status }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodonticCases', patientId] });
    },
  });
}

export function useOrthodonticVisits(caseId: string | undefined) {
  return useQuery<OrthodonticVisit[]>({
    queryKey: ['orthodonticVisits', caseId],
    queryFn: () => apiGet<OrthodonticVisit[]>(`/api/orthodontics/cases/${caseId}/visits`),
    enabled: !!caseId,
  });
}

export type CreateOrthodonticVisitInput = {
  date: string;
  appointmentId?: string;
  wireChanged?: boolean;
  wireStrength?: string;
  elasticsUsed?: string;
  alignerStepNumber?: number;
  notes?: string;
  nextVisitDate?: string;
  cdtCode?: string;
  fee?: number;
};

export function useCreateOrthodonticVisit(caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrthodonticVisitInput) =>
      apiPost<OrthodonticVisit, CreateOrthodonticVisitInput>(
        `/api/orthodontics/cases/${caseId}/visits`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodonticVisits', caseId] });
    },
  });
}
