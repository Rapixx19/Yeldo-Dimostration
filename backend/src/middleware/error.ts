import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

const STATUS_BY_CODE: Record<string, number> = {
  EMAIL_TAKEN: 409,
  INVALID_CREDENTIALS: 401,
  DEMO_USER_NOT_SEEDED: 500,
  UNAUTHORIZED: 401,
  INVALID_TOKEN: 401,
  DEAL_NOT_FOUND: 404,
  DEAL_CLOSED: 410,
  BELOW_MIN_TICKET: 422,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: err.flatten() });
    return;
  }
  const code = err instanceof Error ? err.message : 'INTERNAL_ERROR';
  const status = STATUS_BY_CODE[code] ?? 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ error: code });
}
