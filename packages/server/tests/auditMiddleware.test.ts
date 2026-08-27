import express from 'express';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Prisma mock ────────────────────────────────────────────────────────────
// Same pattern as tests/orthodontics.test.ts: spy functions backing a
// vi.mock of '../src/config/database', so we can assert on what the real
// auditMiddleware() actually wrote instead of just on parseAuditResource's
// pure output.
const auditLogCreate = vi.fn().mockResolvedValue({});

vi.mock('../src/config/database', () => ({
  prisma: {
    auditLog: { create: (...args: unknown[]) => auditLogCreate(...args) },
  },
}));

import { parseAuditResource, auditMiddleware } from '../src/middleware/auditMiddleware';

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

// Exercises auditMiddleware() itself (not just the pure parseAuditResource
// helper) against a real Express request/response pair, proving that a
// request under /api/orthodontics is actually recognized via PHI_ROUTES /
// shouldAudit and results in a real prisma.auditLog.create call — removing
// '/api/orthodontics' from PHI_ROUTES should make this test fail.
describe('auditMiddleware', () => {
  let server: Server;
  let baseUrl: string;

  async function startServer(): Promise<void> {
    const app = express();
    app.use((req, _res, next) => {
      // Simulate an authenticated request the way the real `authenticate`
      // middleware would, upstream of auditMiddleware in the real app.
      (req as any).auth = { providerId: 'provider-1', practiceId: 'practice-1' };
      next();
    });
    app.use(auditMiddleware);
    app.get('/api/orthodontics/cases/:caseId', (req, res) => {
      res.status(200).json({ id: req.params.caseId });
    });
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    auditLogCreate.mockResolvedValue({});
    await startServer();
  });

  afterEach(() => {
    server.close();
  });

  it('creates an audit log entry for a real /api/orthodontics request', async () => {
    const res = await fetch(`${baseUrl}/api/orthodontics/cases/${REAL_PATIENT_ID}`);
    expect(res.status).toBe(200);
    await res.json();

    // res.end's override fires synchronously with res.json(), but the
    // prisma call it kicks off is a fire-and-forget promise, so wait for it
    // to have been invoked before asserting.
    await vi.waitFor(() => expect(auditLogCreate).toHaveBeenCalledTimes(1));

    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerId: 'provider-1',
          resource: 'orthodontics',
          resourceId: REAL_PATIENT_ID,
        }),
      })
    );
  });
});
