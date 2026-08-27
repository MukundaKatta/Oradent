import { describe, expect, it } from 'vitest';
import { appointmentStatusLabel, appointmentTypeLabel } from './appointmentLabels';

describe('appointment labels', () => {
  it('translates API appointment enum values to Brazilian Portuguese', () => {
    expect(appointmentTypeLabel('CLEANING')).toBe('Limpeza');
    expect(appointmentStatusLabel('in-progress')).toBe('Em atendimento');
  });

  it('uses localized safe fallbacks for unknown API enum values', () => {
    expect(appointmentTypeLabel('UNMAPPED_TYPE')).toBe('Tipo não informado');
    expect(appointmentStatusLabel('UNMAPPED_STATUS')).toBe('Status não informado');
  });
});
