import { ptBR } from "@/i18n";

export function formatToothAriaLabel(toothNumber: number, description: string): string {
  return `${ptBR.patientWorkflow.chart.toothAria} ${toothNumber}: ${description}`;
}

export function formatBleedingAriaLabel(site: string, toothNumber: number): string {
  return `${ptBR.patientWorkflow.chart.bleeding}, sítio ${site}, ${ptBR.patientWorkflow.common.tooth.toLowerCase()} ${toothNumber}`;
}

export function formatUpdatedByLabel(name: string): string {
  return `${ptBR.patientWorkflow.chart.by} ${name}`;
}
