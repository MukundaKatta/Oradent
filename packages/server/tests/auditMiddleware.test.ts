import { describe, it, expect } from 'vitest';
import { parseAuditResource } from '../src/middleware/auditMiddleware';

// Real cuid ids look like this (25 chars, lowercase alphanumeric, starts
// with 'c') — copied from a real production patient id seen in this repo's
// history, not a placeholder.
const REAL_PATIENT_ID = 'cmta8lc71002uqh0tpntw7d8c';

describe('parseAuditResource', () => {
  it('captures the resource id from a simple /resource/:id path', () => {
    expect(parseAuditResource(`/api/patients/${REAL_PATIENT_ID}`)).toEqual({
      resource: 'patients',
      resourceId: REAL_PATIENT_ID,
    });
  });

  it('keeps hyphens in the resource name instead of truncating at the first one', () => {
    expect(parseAuditResource(`/api/dental-chart/${REAL_PATIENT_ID}`)).toEqual({
      resource: 'dental-chart',
      resourceId: REAL_PATIENT_ID,
    });
  });

  it('finds the patient id even behind an extra path segment', () => {
    expect(parseAuditResource(`/api/dental-chart/advanced/${REAL_PATIENT_ID}`)).toEqual({
      resource: 'dental-chart',
      resourceId: REAL_PATIENT_ID,
    });
  });

  it('does not mistake a sub-route keyword for the resource id', () => {
    // Previously this matched "invoices" (the sub-collection) as the id.
    expect(parseAuditResource(`/api/billing/invoices/${REAL_PATIENT_ID}`)).toEqual({
      resource: 'billing',
      resourceId: REAL_PATIENT_ID,
    });
  });

  it('finds the id when it is not the last segment', () => {
    expect(parseAuditResource(`/api/dental-chart/${REAL_PATIENT_ID}/tooth/14`)).toEqual({
      resource: 'dental-chart',
      resourceId: REAL_PATIENT_ID,
    });
  });

  it('returns an empty resourceId when no path segment looks like a cuid', () => {
    expect(parseAuditResource('/api/billing/fee-schedule')).toEqual({
      resource: 'billing',
      resourceId: '',
    });
  });

  // Orthodontics writes are clinical/PHI (spec.md Observability sweep row)
  // and must be recognized the same way /api/dental-chart already is.
  it('recognizes /api/orthodontics case writes as PHI', () => {
    expect(parseAuditResource(`/api/orthodontics/cases/${REAL_PATIENT_ID}`)).toEqual({
      resource: 'orthodontics',
      resourceId: REAL_PATIENT_ID,
    });
  });
});
