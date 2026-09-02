import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({ error: 'Validation failed', details: err.flatten() });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  // Postgres unique-violation → 409
  const pgCode = (err as { code?: string })?.code;
  if (pgCode === '23505') {
    return res.status(409).json({ error: 'A record with these unique values already exists' });
  }
  // Database unreachable (host down, credentials rejected, connection refused)
  // → 503, so an infrastructure outage is distinguishable from a code bug.
  if (pgCode && ['XX000', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P01', '53300', '28P01'].includes(pgCode)) {
    console.error('Database unavailable:', err);
    return res.status(503).json({ error: 'Database temporarily unavailable. Please try again shortly.' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}
