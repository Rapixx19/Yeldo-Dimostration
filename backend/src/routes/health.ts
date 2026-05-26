import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /health — service health probe.
 *
 * Returns 200 + JSON payload when:
 *   - Express is serving requests
 *   - Prisma can reach the database (cheap SELECT 1)
 *
 * Returns 503 + JSON error when the DB is unreachable. Railway and any
 * other uptime monitor can flag failures from the status code alone.
 *
 * Payload fields:
 *   - ok          boolean
 *   - service     constant string identifier
 *   - version     package version (so we can confirm which build is live)
 *   - uptimeSec   seconds since process start
 *   - dbLatencyMs round-trip ms for the SELECT 1
 *   - ts          ISO timestamp
 *
 * No secrets in the response (no DB URL, no env values).
 */
router.get('/', async (_req, res) => {
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    res.status(503).json({
      ok: false,
      service: 'yeldo-backend',
      error: 'DB_UNREACHABLE',
      message: err instanceof Error ? err.message : String(err),
      ts: new Date().toISOString(),
    });
    return;
  }
  res.json({
    ok: true,
    service: 'yeldo-backend',
    version: process.env.npm_package_version ?? 'unknown',
    uptimeSec: Math.floor(process.uptime()),
    dbLatencyMs: Date.now() - dbStart,
    ts: new Date().toISOString(),
  });
});

export default router;
