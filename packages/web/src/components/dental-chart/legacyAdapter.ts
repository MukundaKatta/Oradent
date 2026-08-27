import type { ToothConditionEntry, ToothConditionRecord, ToothStatus } from '@/hooks/useDentalChart';
import type { ToothRecord } from './DentalChart';
import type { ToothCondition as SvgToothCondition } from './ToothSVG';

// Adapts between the Prisma-backed ToothCondition shape (one entry per
// condition type, each with a surfaces array) and the legacy SVG chart's
// ToothRecord/ToothCondition shape (one entry per surface+condition pair).

const BACKEND_TO_UI_STATUS: Partial<Record<ToothStatus, ToothRecord['status']>> = {
  MISSING: 'missing',
  IMPLANT: 'implant',
};

const UI_TO_BACKEND_STATUS: Record<ToothRecord['status'], ToothStatus> = {
  healthy: 'PRESENT',
  missing: 'MISSING',
  implant: 'IMPLANT',
};

export function toTeethDataMap(records: ToothConditionRecord[]): Record<number, ToothRecord> {
  const map: Record<number, ToothRecord> = {};
  for (const record of records) {
    // Real stored rows aren't guaranteed to match conditionSchema exactly —
    // e.g. older/seeded data can have a condition entry with no `surfaces`
    // key at all (a crown with no specific surface). Treat that the same as
    // an empty array rather than crashing on `.length` of undefined.
    const conditions: SvgToothCondition[] = record.conditions.flatMap((entry) => {
      const surfaces = entry.surfaces?.length ? entry.surfaces : [''];
      return surfaces.map((surface) => ({ surface, condition: entry.type }));
    });
    map[record.toothNumber] = {
      conditions,
      status: BACKEND_TO_UI_STATUS[record.status] ?? 'healthy',
      notes: record.conditions.map((c) => c.notes).filter(Boolean).join(' | '),
    };
  }
  return map;
}

export interface LegacyUpdatePayload {
  toothNumber: number;
  conditions: ToothConditionEntry[];
  status: ToothStatus;
}

export function toUpdateToothInput(toothNumber: number, record: ToothRecord): LegacyUpdatePayload {
  const byType = new Map<string, string[]>();
  for (const c of record.conditions) {
    const surfaces = byType.get(c.condition) ?? [];
    if (c.surface) surfaces.push(c.surface);
    byType.set(c.condition, surfaces);
  }
  // The UI has one free-text note per tooth, but the backend stores notes
  // per condition entry — put it on the first entry only, or it would
  // duplicate itself (once per condition type) on the next round-trip.
  const conditions: ToothConditionEntry[] = Array.from(byType.entries()).map(([type, surfaces], index) => ({
    type: type as ToothConditionEntry['type'],
    surfaces: surfaces as ToothConditionEntry['surfaces'],
    notes: index === 0 ? record.notes || undefined : undefined,
  }));
  return {
    toothNumber,
    conditions,
    status: UI_TO_BACKEND_STATUS[record.status],
  };
}
