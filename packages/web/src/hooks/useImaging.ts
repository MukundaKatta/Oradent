import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiUpload } from '@/lib/api';

// Mirrors packages/server/src/routes/imaging.ts and prisma/schema.prisma's
// DentalImage model.

export type ImageType =
  | 'PERIAPICAL' | 'BITEWING' | 'PANORAMIC' | 'CEPHALOMETRIC'
  | 'CBCT' | 'INTRAORAL_PHOTO' | 'EXTRAORAL_PHOTO' | 'OTHER';

export interface DentalImageAIAnalysis {
  id: string;
  type: string;
  confidence: number | null;
  accepted: boolean;
  createdAt: string;
}

export interface DentalImage {
  id: string;
  patientId: string;
  type: ImageType;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  toothNumbers: number[];
  dateTaken: string;
  notes: string | null;
  annotations: unknown;
  createdAt: string;
  aiAnalyses: DentalImageAIAnalysis[];
  // Signed, short-lived URL (see services/fileAccessToken.ts server-side) —
  // resolve with apiUrl() before using as <img src>/<a href>, since it's
  // relative to the API origin, not the web app's own origin.
  url: string;
}

export function useImages(patientId: string | undefined) {
  return useQuery<DentalImage[]>({
    queryKey: ['images', patientId],
    queryFn: () => apiGet<DentalImage[]>(`/api/imaging/${patientId}`),
    enabled: !!patientId,
  });
}

export interface UploadImageInput {
  patientId: string;
  file: File;
  type: ImageType;
  toothNumbers?: number[];
  notes?: string;
}

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, file, type, toothNumbers, notes }: UploadImageInput) => {
      const formData = new FormData();
      // Field name must be "image" — multer is configured with
      // uploadImage.single('image') server-side.
      formData.append('image', file);
      formData.append('type', type);
      if (toothNumbers?.length) formData.append('toothNumbers', JSON.stringify(toothNumbers));
      if (notes) formData.append('notes', notes);
      return apiUpload<DentalImage>(`/api/imaging/${patientId}`, formData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['images', variables.patientId] });
    },
  });
}

export function useDeleteImage(patientId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => apiDelete(`/api/imaging/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', patientId] });
    },
  });
}
