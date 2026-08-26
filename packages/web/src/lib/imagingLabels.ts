import { ptBR } from "@/i18n";

export function formatUploadButtonLabel(fileCount: number): string {
  return fileCount > 0
    ? `${ptBR.patientWorkflow.imaging.upload} (${fileCount})`
    : ptBR.patientWorkflow.imaging.upload;
}
