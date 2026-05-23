import { DatabaseLockedError } from '@server/errors';
import { withRetry } from '@server/lib/retry';
import { describe, expect, it } from 'bun:test';

describe('withRetry', () => {
  it('returns result on first successful attempt', async () => {
    const result = await withRetry(async () => 'success');
    expect(result).toBe('success');
  });

  it('retries on SQLite lock errors and succeeds', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) {
        const error = new Error('database is locked');
        (error as Error & { code: string }).code = 'SQLITE_BUSY';
        throw error;
      }
      return 'success after retries';
    });

    expect(result).toBe('success after retries');
    expect(attempts).toBe(3);
  });

  it('throws DatabaseLockedError after exhausting retries', async () => {
    let attempts = 0;
    const lockedError = new Error('database is locked');
    (lockedError as Error & { code: string }).code = 'SQLITE_BUSY';

    await expect(
      withRetry(
        async () => {
          attempts++;
          throw lockedError;
        },
        { maxRetries: 2 }
      )
    ).rejects.toBeInstanceOf(DatabaseLockedError);

    expect(attempts).toBe(3); // Initial + 2 retries
  });

  it('propagates non-lock errors immediately without retry', async () => {
    let attempts = 0;
    const validationError = new Error('Validation failed');

    await expect(
      withRetry(async () => {
        attempts++;
        throw validationError;
      })
    ).rejects.toThrow('Validation failed');

    expect(attempts).toBe(1); // No retries for non-lock errors
  });

  it('uses exponential backoff between retries', async () => {
    const timestamps: number[] = [];
    let attempts = 0;

    const lockedError = new Error('database is locked');
    (lockedError as Error & { code: string }).code = 'SQLITE_BUSY';

    await expect(
      withRetry(
        async () => {
          timestamps.push(Date.now());
          attempts++;
          throw lockedError;
        },
        { maxRetries: 2, baseDelayMs: 50 }
      )
    ).rejects.toBeInstanceOf(DatabaseLockedError);

    expect(attempts).toBe(3);
    expect(timestamps.length).toBe(3);

    // Check that delays increase (with some tolerance for timing)
    const delay1 = timestamps[1] - timestamps[0];
    const delay2 = timestamps[2] - timestamps[1];

    expect(delay1).toBeGreaterThanOrEqual(40); // ~50ms with tolerance
    expect(delay2).toBeGreaterThanOrEqual(80); // ~100ms with tolerance
  });

  it('detects lock errors by message when code is missing', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('database table is locked');
      }
      return 'recovered';
    });

    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });
});
