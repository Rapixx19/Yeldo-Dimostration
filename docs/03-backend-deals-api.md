# Spec 03 — Backend deals API

**Goal:** REST endpoints for listing and reading deals, with query filters.

**Time:** 45 minutes
**Depends on:** `01-database-schema`, `02-backend-auth`
**Outputs:** 2 working deal endpoints

---

## Acceptance criteria

- [ ] `GET /api/deals` returns all deals (or filtered)
- [ ] `GET /api/deals?country=IT&instrument=mezzanine` filters correctly
- [ ] `GET /api/deals?search=mas` does case-insensitive name search
- [ ] `GET /api/deals/:slug` returns single deal with full detail
- [ ] All deals include `sentimentLabel`, `sentimentScore`, `sentimentSignals` in response
- [ ] 404 if slug not found

## Files to create

```
backend/src/
├── routes/deals.ts
├── schemas/deal.ts
```

## Implementation

### `src/schemas/deal.ts`
```typescript
import { z } from 'zod';

export const dealListQuerySchema = z.object({
  country: z.string().length(2).optional(),
  instrument: z.enum(['senior_loan', 'mezzanine', 'senior_debt', 'secured_mezzanine']).optional(),
  status: z.enum(['open', 'closed', 'exited']).optional(),
  maturityMin: z.coerce.number().optional(),
  maturityMax: z.coerce.number().optional(),
  search: z.string().optional(),
});
```

### `src/routes/deals.ts`
```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { dealListQuerySchema } from '../schemas/deal';

const router = Router();

// GET /api/deals — list with optional filters
router.get('/', async (req, res, next) => {
  try {
    const q = dealListQuerySchema.parse(req.query);
    const where: any = {};
    if (q.country) where.country = q.country;
    if (q.instrument) where.instrument = q.instrument;
    if (q.status) where.status = q.status;
    if (q.maturityMin) where.maturityMonths = { ...where.maturityMonths, gte: q.maturityMin };
    if (q.maturityMax) where.maturityMonths = { ...where.maturityMonths, lte: q.maturityMax };
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(deals);
  } catch (err) { next(err); }
});

// GET /api/deals/:slug — single deal
router.get('/:slug', async (req, res, next) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { slug: req.params.slug },
    });
    if (!deal) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(deal);
  } catch (err) { next(err); }
});

export default router;
```

### Wire into `src/index.ts`
```typescript
import dealsRouter from './routes/deals';
app.use('/api/deals', dealsRouter);
```

## Cursor prompt

```
Implement backend/src/routes/deals.ts and backend/src/schemas/deal.ts matching the spec.
GET /api/deals supports query filters: country, instrument, status, maturityMin, maturityMax, search.
GET /api/deals/:slug returns 404 if not found.
Wire the router into src/index.ts under /api/deals (no auth middleware — deals are public).
```
