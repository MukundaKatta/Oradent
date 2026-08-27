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

vi.mock('../src/config/database', () => ({
  prisma: {
    patient: { findFirst: (...args: unknown[]) => patientFindFirst(...args) },
    orthodonticCase: {
      findFirst: (...args: unknown[]) => orthodonticCaseFindFirst(...args),
      findMany: (...args: unknown[]) => orthodonticCaseFindMany(...args),
      create: (...args: unknown[]) => orthodonticCaseCreate(...args),
      update: (...args: unknown[]) => orthodonticCaseUpdate(...args),
    },
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
