# Spec 02 — Backend auth (JWT + bcrypt)

**Goal:** Implement signup, login, demo-login endpoints with JWT and bcrypt. Add auth middleware.

**Time:** 60 minutes
**Depends on:** `01-database-schema`
**Outputs:** 3 working auth endpoints + middleware for protecting routes

---

## Acceptance criteria

- [ ] `POST /api/auth/signup` creates user with bcrypt-hashed password, returns JWT
- [ ] `POST /api/auth/login` verifies password, returns JWT
- [ ] `POST /api/auth/demo-login` returns JWT for demo user without password
- [ ] `authMiddleware` verifies JWT from `Authorization: Bearer <token>` header
- [ ] All endpoints have Zod validation
- [ ] Errors return consistent shape: `{ error: string, details?: any }`

## Files to create

```
backend/src/
├── routes/auth.ts             # 3 endpoints
├── middleware/auth.ts         # JWT verification
├── middleware/error.ts        # Centralized error handler
├── services/auth.ts           # Pure auth logic (no Express)
├── schemas/auth.ts            # Zod schemas
└── lib/jwt.ts                 # JWT sign/verify helpers
```

## Implementation

### `src/lib/jwt.ts`
```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET env var required');

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}
```

### `src/schemas/auth.ts`
```typescript
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

### `src/services/auth.ts`
```typescript
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';

export async function signup(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });
  return { user, token: signToken(user.id) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');
  return { user, token: signToken(user.id) };
}

export async function demoLogin() {
  const user = await prisma.user.findUnique({
    where: { email: 'recruiter@yeldo-demo.app' },
  });
  if (!user) throw new Error('DEMO_USER_NOT_SEEDED');
  return { user, token: signToken(user.id) };
}
```

### `src/routes/auth.ts`
```typescript
import { Router } from 'express';
import { signupSchema, loginSchema } from '../schemas/auth';
import { signup, login, demoLogin } from '../services/auth';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const result = await signup(data.email, data.password, data.name);
    res.json({ user: { id: result.user.id, email: result.user.email, name: result.user.name }, token: result.token });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data.email, data.password);
    res.json({ user: { id: result.user.id, email: result.user.email, name: result.user.name }, token: result.token });
  } catch (err) { next(err); }
});

router.post('/demo-login', async (req, res, next) => {
  try {
    const result = await demoLogin();
    res.json({ user: { id: result.user.id, email: result.user.email, name: result.user.name }, token: result.token });
  } catch (err) { next(err); }
});

export default router;
```

### `src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
  try {
    const { userId } = verifyToken(header.slice(7));
    req.user = { id: userId };
    next();
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}
```

### `src/middleware/error.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.flatten() });
  }
  const code = err.message;
  const map: Record<string, number> = {
    EMAIL_TAKEN: 409,
    INVALID_CREDENTIALS: 401,
    DEMO_USER_NOT_SEEDED: 500,
  };
  const status = map[code] || 500;
  res.status(status).json({ error: code });
}
```

## Cursor prompt

```
Implement the auth system at backend/src/ matching the spec above.
Use bcrypt with cost factor 10 for password hashing.
JWT_SECRET comes from process.env, expire tokens in 7 days.
All errors return JSON with consistent { error, details? } shape.
Wire the auth router into src/index.ts under /api/auth, and add the error middleware last.
```
