import { ptBR } from "@/i18n";
import type { ImageType } from "@/hooks/useImaging";

export function formatUploadButtonLabel(fileCount: number): string {
  return fileCount > 0
    ? `${ptBR.patientWorkflow.imaging.upload} (${fileCount})`
    : ptBR.patientWorkflow.imaging.upload;
}

// The upload form and filter UI use the shorter, lowercase keys already in
// ptBR.patientWorkflow.imaging.types (matching the rest of that catalog's
// style); the server's ImageType enum is uppercase and spells out
// intraoral/extraoral photos as one value each. This is the one place that
// bridges the two, so the mapping only has to be gotten right once.
const TYPE_KEY_TO_ENUM: Record<string, ImageType> = {
  periapical: 'PERIAPICAL',
  bitewing: 'BITEWING',
  panoramic: 'PANORAMIC',
  cephalometric: 'CEPHALOMETRIC',
  cbct: 'CBCT',
  intraoral: 'INTRAORAL_PHOTO',
  extraoral: 'EXTRAORAL_PHOTO',
  other: 'OTHER',
};

const ENUM_TO_TYPE_KEY = Object.fromEntries(
  Object.entries(TYPE_KEY_TO_ENUM).map(([key, value]) => [value, key])
) as Record<ImageType, string>;

export const IMAGE_TYPE_OPTIONS: Array<{ value: ImageType; label: string }> =
  Object.entries(TYPE_KEY_TO_ENUM).map(([key, enumValue]) => ({
    value: enumValue,
    label: ptBR.patientWorkflow.imaging.types[key as keyof typeof ptBR.patientWorkflow.imaging.types],
  }));

export function imageTypeLabel(type: string): string {
  const key = ENUM_TO_TYPE_KEY[type as ImageType];
  return key ? ptBR.patientWorkflow.imaging.types[key as keyof typeof ptBR.patientWorkflow.imaging.types] : type;
}
