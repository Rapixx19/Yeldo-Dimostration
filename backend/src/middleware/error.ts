import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Sentry } from '../lib/sentry.js';

const STATUS_BY_CODE: Record<string, number> = {
  UNAUTHORIZED: 401,
  INVALID_TOKEN: 401,
  DEAL_NOT_FOUND: 404,
  DEAL_CLOSED: 410,
  BELOW_MIN_TICKET: 422,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: err.flatten() });
    return;
  }
  const code = err instanceof Error ? err.message : 'INTERNAL_ERROR';
  const status = STATUS_BY_CODE[code] ?? 500;

  // Forward only real failures (status ≥ 500) to Sentry. Known
  // error codes like UNAUTHORIZED or DEAL_NOT_FOUND are expected
  // user-input situations, not bugs — sending them would create
  // noise without signal.
  if (status >= 500) {
    console.error('[error]', err);
    Sentry.captureException(err, {
      tags: { url: req.originalUrl, method: req.method },
      user: req.user ? { id: req.user.id } : undefined,
    });
  }

  res.status(status).json({ error: code });
}
