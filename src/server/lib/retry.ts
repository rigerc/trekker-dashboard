import { DatabaseLockedError, isSqliteLockedError } from '@server/errors';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff (default: 100) */
  baseDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 100,
};

/**
 * Wraps an async function with retry logic for SQLite lock errors.
 * Uses exponential backoff between retries.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws DatabaseLockedError if all retries are exhausted due to lock errors
 * @throws The original error if it's not a lock error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelayMs } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on SQLite lock errors
      if (!isSqliteLockedError(error)) {
        throw error;
      }

      // If we've exhausted retries, throw a clean DatabaseLockedError
      if (attempt === maxRetries) {
        throw new DatabaseLockedError();
      }

      // Exponential backoff: 100ms, 200ms, 300ms, ...
      const delayMs = baseDelayMs * (attempt + 1);
      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
