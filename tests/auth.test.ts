import { describe, it, expect } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from '@/lib/auth';

describe('Authentication & Session Management', () => {
  it('creates and verifies a valid JWT session token', async () => {
    const token = await createSessionToken({ role: 'admin', email: 'admin@moe.gov.my' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.role).toBe('admin');
    expect(verified?.email).toBe('admin@moe.gov.my');
  });

  it('rejects an invalid or tampered token', async () => {
    const invalidToken = 'eyAiYWxnIjogIkhTMjU2IiB9.invalidPayload.invalidSignature';
    const verified = await verifySessionToken(invalidToken);
    expect(verified).toBeNull();
  });

  it('enforces rate limiting and records failed attempts', () => {
    const testIp = '192.168.1.100';
    clearRateLimit(testIp);

    let status = checkRateLimit(testIp);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(5);

    // Record 4 failed attempts
    recordFailedAttempt(testIp);
    recordFailedAttempt(testIp);
    recordFailedAttempt(testIp);
    recordFailedAttempt(testIp);

    status = checkRateLimit(testIp);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(1);

    // 5th failed attempt triggers lockout
    recordFailedAttempt(testIp);
    status = checkRateLimit(testIp);
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.lockedUntil).toBeDefined();

    clearRateLimit(testIp);
  });
});
