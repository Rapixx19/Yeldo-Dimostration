import type { Request, Response, NextFunction } from 'express';
import { verifySupabaseJWT } from '../lib/supabase.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email?: string };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  try {
    const { sub, email } = await verifySupabaseJWT(header.slice(7));
    req.user = { id: sub, email };
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}
