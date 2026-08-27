import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── node-cron mock ──────────────────────────────────────────────────────
// Capture the scheduled callback instead of letting node-cron actually run
// on a timer, so the test can invoke a single "tick" deterministically.
let scheduledTask: (() => Promise<void>) | undefined;
vi.mock('node-cron', () => ({
  default: {
    schedule: (_expr: string, task: () => Promise<void>) => {
      scheduledTask = task;
    },
  },
}));

// ── logger mock ─────────────────────────────────────────────────────────
const loggerInfo = vi.fn();
const loggerError = vi.fn();
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfo(...args),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));

// ── Prisma mock ─────────────────────────────────────────────────────────
const practiceFindMany = vi.fn();
const orthodonticVisitFindMany = vi.fn();
vi.mock('../src/config/database', () => ({
  prisma: {
    practice: { findMany: (...args: unknown[]) => practiceFindMany(...args) },
    orthodonticVisit: { findMany: (...args: unknown[]) => orthodonticVisitFindMany(...args) },
  },
}));

import { startOrthodonticReminders } from '../src/jobs/orthodonticReminder';

const NOW = new Date('2026-03-10T12:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
  scheduledTask = undefined;
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

async function runTick() {
  startOrthodonticReminders();
  expect(scheduledTask).toBeDefined();
  await scheduledTask!();
}

describe('startOrthodonticReminders', () => {
  // ORTHO-08 AC1: window bounds are derived from the practice's
  // reminderHoursBefore (same PracticeSettings field appointmentReminder.ts
  // uses) — a visit with nextVisitDate = now + reminderHoursBefore is "due".
  it('queries the window [now + reminderHoursBefore, +1h) derived from PracticeSettings', async () => {
    practiceFindMany.mockResolvedValue([{ id: 'practice-1', settings: { reminderHoursBefore: 48 } }]);
    orthodonticVisitFindMany.mockResolvedValue([]);

    await runTick();

    const call = orthodonticVisitFindMany.mock.calls[0][0];
    const expectedStart = new Date(NOW.getTime() + 48 * 60 * 60 * 1000);
    const expectedEnd = new Date(expectedStart.getTime() + 60 * 60 * 1000);
    expect(call.where.nextVisitDate.gte).toEqual(expectedStart);
    expect(call.where.nextVisitDate.lt).toEqual(expectedEnd);
  });

  // ORTHO-08 AC1: a visit returned by the (window-scoped) query is logged
  // with logger.info, identifying the visit/case/patient.
  it('logs a reminder for each visit the window query returns', async () => {
    practiceFindMany.mockResolvedValue([{ id: 'practice-1', settings: { reminderHoursBefore: 24 } }]);
    const dueVisit = {
      id: 'visit-1',
      caseId: 'case-1',
      nextVisitDate: new Date(NOW.getTime() + 24 * 60 * 60 * 1000),
      case: { patient: { firstName: 'Ana', lastName: 'Silva' } },
    };
    orthodonticVisitFindMany.mockResolvedValue([dueVisit]);

    await runTick();

    expect(loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({ visitId: 'visit-1', caseId: 'case-1', patientName: 'Ana Silva' }),
      'Would send orthodontic visit reminder'
    );
  });

  // ORTHO-08: a visit whose case is not ACTIVE must be excluded by the
  // query itself (RETENTION/COMPLETED/DISCONTINUED), not filtered after
  // the fact in application code — asserted by checking the `where` clause
  // actually sent to Prisma, not just the (mocked) result.
  it('scopes the query to ACTIVE cases only', async () => {
    practiceFindMany.mockResolvedValue([{ id: 'practice-1', settings: { reminderHoursBefore: 24 } }]);
    orthodonticVisitFindMany.mockResolvedValue([]);

    await runTick();

    const call = orthodonticVisitFindMany.mock.calls[0][0];
    expect(call.where.case).toEqual(
      expect.objectContaining({ status: 'ACTIVE', patient: { practiceId: 'practice-1' } })
    );
  });

  // ORTHO-08 AC2: never sends a real email/SMS — the job's only observable
  // side effect for a due visit is a single logger.info call.
  it('never sends a real email/SMS, only logs', async () => {
    practiceFindMany.mockResolvedValue([{ id: 'practice-1', settings: { reminderHoursBefore: 24 } }]);
    const dueVisit = {
      id: 'visit-1',
      caseId: 'case-1',
      nextVisitDate: new Date(NOW.getTime() + 24 * 60 * 60 * 1000),
      case: { patient: { firstName: 'Ana', lastName: 'Silva' } },
    };
    orthodonticVisitFindMany.mockResolvedValue([dueVisit]);

    await runTick();

    expect(loggerError).not.toHaveBeenCalled();
    expect(loggerInfo).toHaveBeenCalledTimes(3); // job-scheduled log + per-visit log + total-processed log
  });
});
