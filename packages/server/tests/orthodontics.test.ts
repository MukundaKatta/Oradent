import 'express-async-errors';
import express from 'express';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Prisma mock ────────────────────────────────────────────────────────────
const patientFindFirst = vi.fn();
const orthodonticCaseFindFirst = vi.fn();
const orthodonticCaseFindMany = vi.fn();
const orthodonticCaseCreate = vi.fn();
const orthodonticCaseUpdate = vi.fn();
const appointmentFindFirst = vi.fn();
const orthodonticVisitCreate = vi.fn();
const orthodonticVisitFindMany = vi.fn();
const treatmentCreate = vi.fn();

// A minimal but faithful stand-in for prisma.$transaction: it invokes the
// callback with a `tx` client backed by the SAME spies used elsewhere in
// this file, so assertions on e.g. `orthodonticVisitCreate` reflect calls
// made inside the transaction too. Critically, it does NOT swallow a
// rejection from one step to let a later step still run — if the callback
// throws (e.g. because `treatmentCreate` rejects), the whole thing rejects
// before any subsequent tx call happens, which is what lets the T8
// atomicity test prove the visit was never created when Treatment creation
// fails, without needing a real Postgres transaction.
const transactionMock = vi.fn(async (callback: (tx: unknown) => unknown) => {
  const tx = {
    orthodonticVisit: { create: (...args: unknown[]) => orthodonticVisitCreate(...args) },
    treatment: { create: (...args: unknown[]) => treatmentCreate(...args) },
  };
  return callback(tx);
});

vi.mock('../src/config/database', () => ({
  prisma: {
    patient: { findFirst: (...args: unknown[]) => patientFindFirst(...args) },
    orthodonticCase: {
      findFirst: (...args: unknown[]) => orthodonticCaseFindFirst(...args),
      findMany: (...args: unknown[]) => orthodonticCaseFindMany(...args),
      create: (...args: unknown[]) => orthodonticCaseCreate(...args),
      update: (...args: unknown[]) => orthodonticCaseUpdate(...args),
    },
    appointment: {
      findFirst: (...args: unknown[]) => appointmentFindFirst(...args),
    },
    orthodonticVisit: {
      create: (...args: unknown[]) => orthodonticVisitCreate(...args),
      findMany: (...args: unknown[]) => orthodonticVisitFindMany(...args),
    },
    treatment: {
      create: (...args: unknown[]) => treatmentCreate(...args),
    },
    $transaction: (...args: [(tx: unknown) => unknown]) => transactionMock(...args),
  },
}));

// ── Auth mock ────────────────────────────────────────────────────────────
// The route file itself doesn't care who authenticated it beyond req.auth;
// exercising real JWT/redis verification is out of scope for this router's
// own branch coverage, so authenticate is replaced with a stub that installs
// whatever req.auth the test configured.
let currentAuth: { providerId: string; practiceId: string; role: string; email: string; sessionVersion: number } = {
  providerId: 'provider-1',
  practiceId: 'practice-1',
  role: 'DENTIST',
  email: 'dentist@practice1.example',
  sessionVersion: 1,
};

vi.mock('../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.auth = currentAuth;
    next();
  },
}));

import orthodonticsRouter from '../src/routes/orthodontics';
import { errorHandler } from '../src/middleware/errorHandler';

async function startServer(): Promise<{ server: Server; baseUrl: string }> {
  const app = express();
  app.use(express.json());
  app.use('/api/orthodontics', orthodonticsRouter);
  app.use(errorHandler);
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return { server, baseUrl: `http://localhost:${port}/api/orthodontics` };
}

function json(baseUrl: string, path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
}

let server: Server;
let baseUrl: string;

beforeEach(async () => {
  vi.clearAllMocks();
  currentAuth = {
    providerId: 'provider-1',
    practiceId: 'practice-1',
    role: 'DENTIST',
    email: 'dentist@practice1.example',
    sessionVersion: 1,
  };
  ({ server, baseUrl } = await startServer());
});

afterEach(() => {
  server.close();
});

const validCasePatient = { id: 'patient-1', practiceId: 'practice-1' };

describe('POST /cases', () => {
  // ORTHO-01 AC1: valid create -> 201 with status ACTIVE
  it('creates an OrthodonticCase with status ACTIVE and returns 201', async () => {
    patientFindFirst.mockResolvedValue(validCasePatient);
    orthodonticCaseFindFirst.mockResolvedValue(null); // no existing active case
    const created = {
      id: 'case-1',
      patientId: 'patient-1',
      providerId: 'provider-1',
      applianceType: 'ALIGNER',
      status: 'ACTIVE',
      startDate: '2026-01-01T00:00:00.000Z',
    };
    orthodonticCaseCreate.mockResolvedValue(created);

    const res = await json(baseUrl, '/cases', {
      method: 'POST',
      body: JSON.stringify({ patientId: 'patient-1', applianceType: 'ALIGNER', startDate: '2026-01-01' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('ACTIVE');
    // Persisted with exactly one patientId and one providerId (ORTHO-01 AC7)
    expect(orthodonticCaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ patientId: 'patient-1', providerId: 'provider-1' }),
      })
    );
  });

  // ORTHO-01 AC2: cross-tenant patientId -> 404, no record created
  it('returns 404 and does not create a case when patientId is outside the provider practice', async () => {
    patientFindFirst.mockResolvedValue(null); // scoped lookup found nothing

    const res = await json(baseUrl, '/cases', {
      method: 'POST',
      body: JSON.stringify({ patientId: 'other-practice-patient', applianceType: 'ALIGNER', startDate: '2026-01-01' }),
    });

    expect(res.status).toBe(404);
    expect(orthodonticCaseCreate).not.toHaveBeenCalled();
    // Tenant scoping must be enforced in the query itself
    expect(patientFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ practiceId: 'practice-1' }) })
    );
  });

  // ORTHO-01 AC3: patient already has an ACTIVE case -> 409, no record created
  it('returns 409 when the patient already has an ACTIVE case', async () => {
    patientFindFirst.mockResolvedValue(validCasePatient);
    orthodonticCaseFindFirst.mockResolvedValue({ id: 'existing-active-case', status: 'ACTIVE' });

    const res = await json(baseUrl, '/cases', {
      method: 'POST',
      body: JSON.stringify({ patientId: 'patient-1', applianceType: 'ALIGNER', startDate: '2026-01-01' }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('existing-active-case');
    expect(orthodonticCaseCreate).not.toHaveBeenCalled();
  });

  // ORTHO-01 AC4: applianceType outside the enum -> 400
  it('returns 400 when applianceType is not a valid enum value', async () => {
    const res = await json(baseUrl, '/cases', {
      method: 'POST',
      body: JSON.stringify({ patientId: 'patient-1', applianceType: 'INVISIBLE_MAGIC', startDate: '2026-01-01' }),
    });

    expect(res.status).toBe(400);
    expect(orthodonticCaseCreate).not.toHaveBeenCalled();
  });

  // ORTHO-01 AC5: estimatedEndDate before startDate -> 400
  it('returns 400 when estimatedEndDate is before startDate', async () => {
    patientFindFirst.mockResolvedValue(validCasePatient);
    orthodonticCaseFindFirst.mockResolvedValue(null);

    const res = await json(baseUrl, '/cases', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'patient-1',
        applianceType: 'ALIGNER',
        startDate: '2026-06-01',
        estimatedEndDate: '2026-01-01',
      }),
    });

    expect(res.status).toBe(400);
    expect(orthodonticCaseCreate).not.toHaveBeenCalled();
  });
});

describe('GET /cases/:patientId', () => {
  // ORTHO-06: returns active + historical cases scoped to practiceId
  it('returns cases (active and historical) for the patient', async () => {
    patientFindFirst.mockResolvedValue(validCasePatient);
    const cases = [
      { id: 'case-1', status: 'ACTIVE' },
      { id: 'case-2', status: 'COMPLETED' },
    ];
    orthodonticCaseFindMany.mockResolvedValue(cases);

    const res = await json(baseUrl, '/cases/patient-1');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(cases);
    expect(orthodonticCaseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ patientId: 'patient-1' }) })
    );
  });

  // Cross-tenant scoping edge case (spec.md Edge Cases): 404, not an empty list, not 500
  it('returns 404 for a patientId outside the provider practice', async () => {
    patientFindFirst.mockResolvedValue(null);

    const res = await json(baseUrl, '/cases/other-practice-patient');

    expect(res.status).toBe(404);
    expect(orthodonticCaseFindMany).not.toHaveBeenCalled();
  });
});

describe('PATCH /cases/:caseId', () => {
  const transitionCases: Array<[string, string]> = [
    ['ACTIVE', 'RETENTION'],
    ['ACTIVE', 'COMPLETED'],
    ['ACTIVE', 'DISCONTINUED'],
    ['RETENTION', 'COMPLETED'],
  ];

  // ORTHO-09 AC1: each valid transition -> 200
  for (const [from, to] of transitionCases) {
    it(`allows ${from} -> ${to} and returns 200`, async () => {
      orthodonticCaseFindFirst.mockResolvedValue({ id: 'case-1', status: from });
      orthodonticCaseUpdate.mockResolvedValue({ id: 'case-1', status: to });

      const res = await json(baseUrl, '/cases/case-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: to }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe(to);
    });
  }

  // ORTHO-09 AC2: invalid transition -> 400
  it('returns 400 for an invalid transition (COMPLETED -> ACTIVE)', async () => {
    orthodonticCaseFindFirst.mockResolvedValue({ id: 'case-1', status: 'COMPLETED' });

    const res = await json(baseUrl, '/cases/case-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    expect(res.status).toBe(400);
    expect(orthodonticCaseUpdate).not.toHaveBeenCalled();
  });

  // Cross-tenant caseId -> 404 (spec.md Edge Cases)
  it('returns 404 for a caseId outside the provider practice', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(null);

    const res = await json(baseUrl, '/cases/other-practice-case', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' }),
    });

    expect(res.status).toBe(404);
    expect(orthodonticCaseUpdate).not.toHaveBeenCalled();
  });
});

describe('POST /cases/:caseId/visits', () => {
  const activeCase = {
    id: 'case-1',
    patientId: 'patient-1',
    status: 'ACTIVE',
    applianceType: 'FIXED_METAL',
  };

  // ORTHO-04 AC1: valid visit for an ACTIVE case -> 201
  it('creates an OrthodonticVisit and returns 201', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase);
    const created = { id: 'visit-1', caseId: 'case-1', date: '2026-01-05T00:00:00.000Z', wireChanged: true };
    orthodonticVisitCreate.mockResolvedValue(created);

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('visit-1');
    expect(orthodonticVisitCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ caseId: 'case-1' }) })
    );
  });

  // ORTHO-04 AC2: caseId not found / cross-tenant -> 404
  it('returns 404 when the case does not exist or is outside the provider practice', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(null);

    const res = await json(baseUrl, '/cases/other-practice-case/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true }),
    });

    expect(res.status).toBe(404);
    expect(orthodonticVisitCreate).not.toHaveBeenCalled();
  });

  // ORTHO-04 AC3: case not ACTIVE -> 409, visit not created
  it('returns 409 when the referenced case is not ACTIVE', async () => {
    orthodonticCaseFindFirst.mockResolvedValue({ ...activeCase, status: 'RETENTION' });

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true }),
    });

    expect(res.status).toBe(409);
    expect(orthodonticVisitCreate).not.toHaveBeenCalled();
  });

  // ORTHO-04 AC4: appointmentId not belonging to the case's patient/practice -> 404
  it('returns 404 when appointmentId does not belong to the same patient/practice', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase);
    appointmentFindFirst.mockResolvedValue(null);

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true, appointmentId: 'other-appointment' }),
    });

    expect(res.status).toBe(404);
    expect(orthodonticVisitCreate).not.toHaveBeenCalled();
    expect(appointmentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'other-appointment', patientId: 'patient-1' }),
      })
    );
  });

  // ORTHO-05: alignerStepNumber on a non-ALIGNER case -> 400
  it('returns 400 when alignerStepNumber is set but the case is not ALIGNER', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase); // FIXED_METAL

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', alignerStepNumber: 3 }),
    });

    expect(res.status).toBe(400);
    expect(orthodonticVisitCreate).not.toHaveBeenCalled();
  });

  // ORTHO-04 AC6: nextVisitDate in the past -> 400
  it('returns 400 when nextVisitDate is before the current date', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase);

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true, nextVisitDate: '2020-01-01' }),
    });

    expect(res.status).toBe(400);
    expect(orthodonticVisitCreate).not.toHaveBeenCalled();
  });

  // ORTHO-07 AC1: cdtCode + fee present -> Treatment created and linked via treatmentId
  it('creates a linked Treatment when cdtCode and fee are provided', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase);
    treatmentCreate.mockResolvedValue({ id: 'treatment-1', cdtCode: 'D8670', fee: 500 });
    orthodonticVisitCreate.mockResolvedValue({ id: 'visit-1', treatmentId: 'treatment-1' });

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true, cdtCode: 'D8670', fee: 500 }),
    });

    expect(res.status).toBe(201);
    expect(treatmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cdtCode: 'D8670', fee: 500 }) })
    );
    expect(orthodonticVisitCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ treatmentId: 'treatment-1' }) })
    );
  });

  // ORTHO-07 AC2: cdtCode outside D8000-D8999 -> 400, nothing created
  it('returns 400 when cdtCode is outside the D8000-D8999 orthodontic range', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase);

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true, cdtCode: 'D1110', fee: 100 }),
    });

    expect(res.status).toBe(400);
    expect(treatmentCreate).not.toHaveBeenCalled();
    expect(orthodonticVisitCreate).not.toHaveBeenCalled();
  });

  // ORTHO-07 AC3: neither cdtCode nor fee -> visit created without a Treatment
  it('creates the visit without a Treatment when cdtCode/fee are absent', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase);
    orthodonticVisitCreate.mockResolvedValue({ id: 'visit-1', treatmentId: null });

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true }),
    });

    expect(res.status).toBe(201);
    expect(treatmentCreate).not.toHaveBeenCalled();
    const call = orthodonticVisitCreate.mock.calls[0][0];
    expect(call.data).not.toHaveProperty('treatmentId');
  });

  // Visits story AC8: Treatment + visit created in one transaction; if Treatment
  // creation fails, the visit must NOT be persisted either.
  it('does not create the visit when the linked Treatment creation fails (transaction rollback)', async () => {
    orthodonticCaseFindFirst.mockResolvedValue(activeCase);
    treatmentCreate.mockRejectedValue(new Error('insert failed'));

    const res = await json(baseUrl, '/cases/case-1/visits', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-01-05', wireChanged: true, cdtCode: 'D8670', fee: 500 }),
    });

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(treatmentCreate).toHaveBeenCalled();
    // The visit-create call must never happen once Treatment creation
    // threw inside the same $transaction callback — proving the two are
    // atomic rather than two independent writes.
    expect(orthodonticVisitCreate).not.toHaveBeenCalled();
  });
});
