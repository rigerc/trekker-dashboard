import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from '@server/lib/constants';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(HTTP_STATUS_NOT_FOUND, 'NOT_FOUND', `${entity} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS_BAD_REQUEST, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS_CONFLICT, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS_INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseLockedError extends AppError {
  constructor() {
    super(
      HTTP_STATUS_SERVICE_UNAVAILABLE,
      'DATABASE_LOCKED',
      'Database is locked. Try again in a moment.'
    );
    this.name = 'DatabaseLockedError';
  }
}

export function isSqliteLockedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: unknown; message?: unknown };
  let code = '';
  if (typeof maybeError.code === 'string') {
    code = maybeError.code.toUpperCase();
  }

  let message = '';
  if (typeof maybeError.message === 'string') {
    message = maybeError.message.toLowerCase();
  }

  return (
    code === 'SQLITE_BUSY' ||
    code === 'SQLITE_LOCKED' ||
    message.includes('database is locked') ||
    message.includes('database table is locked')
  );
}

export function isSqliteError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: unknown; message?: unknown };
  let code = '';
  if (typeof maybeError.code === 'string') {
    code = maybeError.code.toUpperCase();
  }

  let message = '';
  if (typeof maybeError.message === 'string') {
    message = maybeError.message.toLowerCase();
  }

  return code.startsWith('SQLITE_') || message.includes('sqlite');
}
