import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, ApiClientError } from '@/lib/api';

// Mirrors packages/server/src/routes/ai.ts and services/xrayAnalyzer.ts.
// There is no async job/status model server-side — POST /analyze-xray
// calls the vision model and awaits the full result in one request, so
// there's no "pending"/"processing" state to poll, only "not run yet",
// "running" (client-side, while the mutation is in flight), and "done".

export interface XrayFinding {
  tooth_number: number;
  finding_type: string;
  location: string;
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  description: string;
  recommendation: string;
}

export interface XrayAnalysisOutput {
  findings: XrayFinding[];
  summary: string;
  image_quality: string;
  image_type: string;
  overallConfidence: number;
}

export interface AIAnalysis {
  id: string;
  patientId: string;
  imageId: string | null;
  type: string;
  output: XrayAnalysisOutput;
  confidence: number | null;
  findings: XrayFinding[] | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  accepted: boolean;
  model: string;
  createdAt: string;
}

export function useXrayAnalysis(imageId: string | undefined) {
  return useQuery<AIAnalysis | null>({
    queryKey: ['xrayAnalysis', imageId],
    queryFn: async () => {
      try {
        return await apiGet<AIAnalysis>(`/api/ai/xray-analysis/${imageId}`);
      } catch (err) {
        // 404 means "no analysis run yet for this image" — an expected,
        // non-error state here, not something to surface as a query error.
        if (err instanceof ApiClientError && err.statusCode === 404) return null;
        throw err;
      }
    },
    enabled: !!imageId,
  });
}

export function useRunXrayAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, patientId }: { imageId: string; patientId: string }) =>
      apiPost<AIAnalysis>('/api/ai/analyze-xray', { imageId, patientId }),
    onSuccess: (analysis) => {
      queryClient.setQueryData(['xrayAnalysis', analysis.imageId], analysis);
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
}

export function useReviewAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, accepted }: { analysisId: string; accepted: boolean }) =>
      apiPatch<AIAnalysis>(`/api/ai/analysis/${analysisId}/review`, { accepted }),
    onSuccess: (analysis) => {
      queryClient.setQueryData(['xrayAnalysis', analysis.imageId], analysis);
    },
  });
}
