import { describe, expect, it } from 'vitest';
import { toTeethDataMap, toUpdateToothInput } from './legacyAdapter';
import type { ToothConditionRecord } from '@/hooks/useDentalChart';

describe('legacyAdapter', () => {
  it('maps a healthy tooth with no conditions', () => {
    const records: ToothConditionRecord[] = [
      { id: '1', patientId: 'p1', toothNumber: 8, conditions: [], status: 'PRESENT', isDeciduous: false, updatedAt: '2026-01-01' },
    ];
    const map = toTeethDataMap(records);
    expect(map[8]).toEqual({ conditions: [], status: 'healthy', notes: '' });
  });

  it('expands a multi-surface condition into one entry per surface', () => {
    const records: ToothConditionRecord[] = [
      {
        id: '1', patientId: 'p1', toothNumber: 14, status: 'PRESENT', isDeciduous: false, updatedAt: '2026-01-01',
        conditions: [{ type: 'cavity', surfaces: ['M', 'O'], notes: 'Dor ao mastigar' }],
      },
    ];
    const map = toTeethDataMap(records);
    expect(map[14].conditions).toEqual([
      { surface: 'M', condition: 'cavity' },
      { surface: 'O', condition: 'cavity' },
    ]);
    expect(map[14].notes).toBe('Dor ao mastigar');
  });

  it('does not crash on a condition entry with no surfaces key (real seed data)', () => {
    // Regression test: a real production record for a crown had no `surfaces`
    // field at all (not even an empty array) — {"type": "crown", "material": "PFM"}.
    // conditionSchema defaults surfaces to [] on write, but rows inserted
    // outside that Zod path can omit it entirely, and GET returns the raw
    // stored JSON without re-validating.
    const records = [
      {
        id: '1', patientId: 'p1', toothNumber: 19, status: 'PRESENT' as const, isDeciduous: false, updatedAt: '2026-01-01',
        conditions: [{ type: 'crown' } as ToothConditionRecord['conditions'][number]],
      },
    ];
    expect(() => toTeethDataMap(records)).not.toThrow();
    expect(toTeethDataMap(records)[19].conditions).toEqual([{ surface: '', condition: 'crown' }]);
  });

  it('maps MISSING/IMPLANT status to the UI vocabulary', () => {
    const records: ToothConditionRecord[] = [
      { id: '1', patientId: 'p1', toothNumber: 1, conditions: [], status: 'MISSING', isDeciduous: false, updatedAt: '2026-01-01' },
      { id: '2', patientId: 'p1', toothNumber: 2, conditions: [], status: 'IMPLANT', isDeciduous: false, updatedAt: '2026-01-01' },
      { id: '3', patientId: 'p1', toothNumber: 3, conditions: [], status: 'IMPACTED', isDeciduous: false, updatedAt: '2026-01-01' },
    ];
    const map = toTeethDataMap(records);
    expect(map[1].status).toBe('missing');
    expect(map[2].status).toBe('implant');
    // Statuses the legacy UI has no vocabulary for fall back to 'healthy'
    // rather than crashing or silently dropping the tooth.
    expect(map[3].status).toBe('healthy');
  });

  it('round-trips: UI edit -> backend payload -> UI map matches the edit', () => {
    const uiRecord = {
      conditions: [
        { surface: 'M', condition: 'cavity' },
        { surface: 'O', condition: 'cavity' },
        { surface: 'B', condition: 'filling' },
      ],
      status: 'healthy' as const,
      notes: 'Observação clínica',
    };

    const payload = toUpdateToothInput(14, uiRecord);
    expect(payload.status).toBe('PRESENT');
    // Only the first condition entry carries the note — otherwise it would
    // duplicate itself (once per condition type) on the next round-trip.
    expect(payload.conditions).toEqual(
      expect.arrayContaining([
        { type: 'cavity', surfaces: ['M', 'O'], notes: 'Observação clínica' },
        { type: 'filling', surfaces: ['B'], notes: undefined },
      ])
    );

    const record: ToothConditionRecord = {
      id: '1', patientId: 'p1', toothNumber: 14, isDeciduous: false, updatedAt: '2026-01-01',
      status: payload.status,
      conditions: payload.conditions,
    };
    const roundTripped = toTeethDataMap([record])[14];
    expect(roundTripped.status).toBe('healthy');
    expect(roundTripped.notes).toBe('Observação clínica');
    const sortKey = (c: { surface: string; condition: string }) => `${c.condition}:${c.surface}`;
    expect([...roundTripped.conditions].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))).toEqual(
      [...uiRecord.conditions].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    );
  });
});
