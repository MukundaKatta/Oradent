import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, ApiClientError } from '@/lib/api';

// AdvancedOdontogramChart row from the server. `statusChart` is the opaque
// payload from react-advanced-odontogram's getStatusChart() — see
// ODONTOGRAM_DATA_MAPPING.md for why it isn't typed further.
export interface AdvancedOdontogramChartRecord {
  id: string;
  patientId: string;
  statusChart: unknown;
  version: number;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

const AUTOSAVE_DEBOUNCE_MS = 1200;

export function useAdvancedOdontogram(patientId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['advancedOdontogramChart', patientId];

  const query = useQuery<AdvancedOdontogramChartRecord | null>({
    queryKey,
    queryFn: () => apiGet<AdvancedOdontogramChartRecord | null>(`/api/dental-chart/advanced/${patientId}`),
    enabled: !!patientId,
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const versionRef = useRef<number>(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChartRef = useRef<unknown>(undefined);
  const mountedRef = useRef(true);

  if (query.data) {
    versionRef.current = query.data.version;
  }

  const sendSave = useCallback(
    async (statusChart: unknown) => {
      if (!patientId) return;
      if (mountedRef.current) setSaveStatus('saving');
      try {
        const saved = await apiPut<AdvancedOdontogramChartRecord>(
          `/api/dental-chart/advanced/${patientId}`,
          { statusChart, version: versionRef.current }
        );
        versionRef.current = saved.version;
        pendingChartRef.current = undefined;
        queryClient.setQueryData(queryKey, saved);
        if (mountedRef.current) setSaveStatus('saved');
      } catch (err) {
        if (!mountedRef.current) return;
        if (err instanceof ApiClientError && err.statusCode === 409) {
          setSaveStatus('conflict');
          return;
        }
        setSaveStatus('error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patientId]
  );

  const save = useCallback(
    (statusChart: unknown) => {
      pendingChartRef.current = statusChart;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void sendSave(statusChart);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [sendSave]
  );

  // If the component unmounts (e.g. the user switches back to the legacy
  // chart) while an edit is still debounced, flush it immediately instead of
  // discarding it — losing a clinical edit silently is worse than one extra
  // request. The in-flight request is fire-and-forget: any resulting state
  // update is guarded by mountedRef so it's a no-op after unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        if (pendingChartRef.current !== undefined) {
          void sendSave(pendingChartRef.current);
        }
      }
    };
  }, [sendSave]);

  return {
    chart: query.data,
    isLoading: query.isLoading,
    saveStatus,
    save,
    refetch: query.refetch,
  };
}
