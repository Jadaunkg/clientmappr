import { describe, test, expect } from '@jest/globals';
import { consumeInMemoryRateLimit } from '../../src/middleware/googleMapsRateLimit.js';

describe('consumeInMemoryRateLimit', () => {
  test('allows requests under limit', () => {
    const first = consumeInMemoryRateLimit({
      clientId: 'u1',
      limit: 2,
      windowMs: 1000,
      nowMs: 100,
    });

    const second = consumeInMemoryRateLimit({
      clientId: 'u1',
      limit: 2,
      windowMs: 1000,
      nowMs: 200,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.count).toBe(2);
  });

  test('blocks requests over limit in same window', () => {
    consumeInMemoryRateLimit({ clientId: 'u2', limit: 1, windowMs: 1000, nowMs: 100 });
    const blocked = consumeInMemoryRateLimit({ clientId: 'u2', limit: 1, windowMs: 1000, nowMs: 200 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(0);
  });

  test('resets counter in new window', () => {
    consumeInMemoryRateLimit({ clientId: 'u3', limit: 1, windowMs: 1000, nowMs: 100 });
    const nextWindow = consumeInMemoryRateLimit({ clientId: 'u3', limit: 1, windowMs: 1000, nowMs: 1200 });

    expect(nextWindow.allowed).toBe(true);
    expect(nextWindow.count).toBe(1);
  });
});
