import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  try {
    const { userId } = verifyToken(header.slice(7));
    req.user = { id: userId };
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}
