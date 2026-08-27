import { describe, it, expect, vi } from 'vitest';

const findMany = vi.fn().mockResolvedValue([]);
const count = vi.fn().mockResolvedValue(0);

vi.mock('../src/config/database', () => ({
  prisma: {
    auditLog: {
      findMany: (...args: unknown[]) => findMany(...args),
      count: (...args: unknown[]) => count(...args),
    },
  },
}));

import { getAuditLogs } from '../src/services/auditLog';

describe('getAuditLogs', () => {
  it('always scopes the query by practiceId, not just the optional filters', async () => {
    await getAuditLogs({ practiceId: 'practice-1' });

    const where = findMany.mock.calls[0][0].where;
    expect(where.provider).toEqual({ practiceId: 'practice-1' });

    const countWhere = count.mock.calls[0][0].where;
    expect(countWhere.provider).toEqual({ practiceId: 'practice-1' });
  });

  it('layers optional filters on top of the required practice scope', async () => {
    await getAuditLogs({ practiceId: 'practice-1', resource: 'patients', resourceId: 'abc' });

    const where = findMany.mock.calls[1][0].where;
    expect(where).toMatchObject({
      provider: { practiceId: 'practice-1' },
      resource: 'patients',
      resourceId: 'abc',
    });
  });
});
