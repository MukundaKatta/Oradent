import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config/env', () => ({
  env: { JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long' },
}));

import { generateFileAccessToken, verifyFileAccessToken } from '../src/services/fileAccessToken';

describe('fileAccessToken', () => {
  it('round-trips a valid token for the matching imageId', () => {
    const token = generateFileAccessToken('image-1', 'practice-1');
    const result = verifyFileAccessToken(token, 'image-1');
    expect(result).toEqual({ practiceId: 'practice-1' });
  });

  it('rejects a token presented for a different imageId', () => {
    // Otherwise a token minted for one image could be replayed against
    // another image's URL within the same practice.
    const token = generateFileAccessToken('image-1', 'practice-1');
    expect(verifyFileAccessToken(token, 'image-2')).toBeNull();
  });

  it('rejects a garbage token', () => {
    expect(verifyFileAccessToken('not-a-real-token', 'image-1')).toBeNull();
  });
});
