import { clinicalPtBR, t } from '@/i18n';

const statusAliases: Record<string, keyof typeof clinicalPtBR.appointmentStatus> = {
  IN_PROGRESS: 'IN_CHAIR',
};

function toCatalogKey(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function appointmentTypeLabel(type: string): string {
  const key = toCatalogKey(type) as keyof typeof clinicalPtBR.appointmentType;

  return clinicalPtBR.appointmentType[key] ?? t('appointments.unknownType', 'Tipo não informado');
}

export function appointmentStatusLabel(status: string): string {
  const normalizedKey = toCatalogKey(status);
  const key = statusAliases[normalizedKey] ?? normalizedKey as keyof typeof clinicalPtBR.appointmentStatus;

  return clinicalPtBR.appointmentStatus[key] ?? t('appointments.unknownStatus', 'Status não informado');
}
