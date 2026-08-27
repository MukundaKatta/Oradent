import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/lib/api';

// Mirrors packages/server/src/routes/dentalChart.ts's conditionSchema exactly.
export interface ToothConditionEntry {
  type:
    | 'cavity' | 'filling' | 'crown' | 'bridge' | 'implant' | 'missing'
    | 'rootCanal' | 'extraction' | 'veneer' | 'sealant' | 'fracture'
    | 'abscess' | 'impacted' | 'recession' | 'mobility' | 'furcation' | 'watchItem';
  surfaces: ('M' | 'O' | 'I' | 'D' | 'B' | 'L' | 'F' | 'P')[];
  severity?: 'mild' | 'moderate' | 'severe';
  date?: string;
  notes?: string;
  providerId?: string;
}

export type ToothStatus = 'PRESENT' | 'MISSING' | 'IMPACTED' | 'UNERUPTED' | 'IMPLANT' | 'PONTIC';

// The real shape of GET /api/dental-chart/:patientId — a flat array, not the
// {patientId, teeth, lastUpdated, updatedBy} wrapper this hook used to assume.
export interface ToothConditionRecord {
  id: string;
  patientId: string;
  toothNumber: number;
  conditions: ToothConditionEntry[];
  status: ToothStatus;
  isDeciduous: boolean;
  updatedAt: string;
}

export interface UpdateToothInput {
  toothNumber: number;
  conditions?: ToothConditionEntry[];
  status?: ToothStatus;
  isDeciduous?: boolean;
}

export function useDentalChart(patientId: string | undefined) {
  return useQuery<ToothConditionRecord[]>({
    queryKey: ['dentalChart', patientId],
    queryFn: () => apiGet<ToothConditionRecord[]>(`/api/dental-chart/${patientId}`),
    enabled: !!patientId,
  });
}

export function useUpdateTooth(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateToothInput) =>
      apiPut<ToothConditionRecord, UpdateToothInput>(
        `/api/dental-chart/${patientId}/tooth/${data.toothNumber}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentalChart', patientId] });
    },
  });
}
