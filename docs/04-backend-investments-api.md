# Spec 04 — Backend investments API

**Goal:** Protected endpoints for creating virtual investments and reading the user's portfolio.

**Time:** 60 minutes
**Depends on:** `02-backend-auth`, `03-backend-deals-api`
**Outputs:** 3 working investment endpoints

---

## Acceptance criteria

- [ ] `POST /api/investments` (auth required) creates investment with validation
- [ ] Validation: deal must exist + be open, amount >= minimumTicket, amount <= remaining capacity
- [ ] `GET /api/investments` (auth required) returns user's investments with joined deal data
- [ ] `GET /api/portfolio` (auth required) returns aggregated KPIs
- [ ] All protected endpoints return 401 without valid JWT
- [ ] Investments are scoped per user (cannot see other users' investments)

## Files to create

```
backend/src/
├── routes/investments.ts
├── schemas/investment.ts
├── services/portfolio.ts
```

## Implementation

### `src/schemas/investment.ts`
```typescript
import { z } from 'zod';

export const createInvestmentSchema = z.object({
  dealId: z.string().min(1),
  amount: z.number().positive(),
});
```

### `src/services/portfolio.ts`
```typescript
import { prisma } from '../lib/prisma';

/**
 * Aggregated portfolio KPIs for a user.
 *
 * Computes:
 * - totalInvested = SUM(amount across all investments)
 * - weightedIRR = SUM(amount * irr) / SUM(amount)
 * - projectedReturns = SUM(amount * irr * (maturityMonths/12))
 * - activeDealsCount = count of distinct deals
 * - countryAllocation = map of country -> { amount, pct }
 */
export async function getPortfolioKPIs(userId: string) {
  const investments = await prisma.investment.findMany({
    where: { userId },
    include: { deal: true },
  });

  if (investments.length === 0) {
    return {
      totalInvested: 0, weightedIRR: 0, projectedReturns: 0,
      activeDealsCount: 0, countryAllocation: {},
    };
  }

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const weightedIRR = investments.reduce((s, i) => s + i.amount * i.deal.targetIRR, 0) / totalInvested;
  const projectedReturns = investments.reduce(
    (s, i) => s + i.amount * (i.deal.targetIRR / 100) * (i.deal.maturityMonths / 12),
    0
  );

  // Country allocation
  const byCountry: Record<string, number> = {};
  for (const inv of investments) {
    byCountry[inv.deal.country] = (byCountry[inv.deal.country] || 0) + inv.amount;
  }
  const countryAllocation = Object.fromEntries(
    Object.entries(byCountry).map(([c, amt]) => [c, { amount: amt, pct: (amt / totalInvested) * 100 }])
  );

  return {
    totalInvested,
    weightedIRR: parseFloat(weightedIRR.toFixed(2)),
    projectedReturns: parseFloat(projectedReturns.toFixed(2)),
    activeDealsCount: new Set(investments.map(i => i.dealId)).size,
    countryAllocation,
  };
}
```

### `src/routes/investments.ts`
```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { createInvestmentSchema } from '../schemas/investment';
import { getPortfolioKPIs } from '../services/portfolio';

const router = Router();
router.use(authMiddleware);  // All routes below require auth

// POST /api/investments — virtual invest
router.post('/', async (req, res, next) => {
  try {
    const data = createInvestmentSchema.parse(req.body);
    const deal = await prisma.deal.findUnique({ where: { id: data.dealId } });
    if (!deal) return res.status(404).json({ error: 'DEAL_NOT_FOUND' });
    if (deal.status !== 'open') return res.status(400).json({ error: 'DEAL_NOT_OPEN' });
    if (data.amount < deal.minimumTicket) return res.status(400).json({ error: 'BELOW_MINIMUM' });
    const remaining = deal.targetRaise - deal.raisedAmount;
    if (data.amount > remaining) return res.status(400).json({ error: 'EXCEEDS_CAPACITY', details: { remaining } });

    const investment = await prisma.investment.create({
      data: {
        userId: req.user!.id,
        dealId: data.dealId,
        amount: data.amount,
      },
      include: { deal: true },
    });

    // Update deal's raised amount
    await prisma.deal.update({
      where: { id: data.dealId },
      data: { raisedAmount: { increment: data.amount } },
    });

    res.json(investment);
  } catch (err) { next(err); }
});

// GET /api/investments — user's investments with deal data
router.get('/', async (req, res, next) => {
  try {
    const investments = await prisma.investment.findMany({
      where: { userId: req.user!.id },
      include: { deal: true },
      orderBy: { investedAt: 'desc' },
    });
    res.json(investments);
  } catch (err) { next(err); }
});

export default router;

// Separate route file for portfolio (could also be inline)
export const portfolioRouter = (() => {
  const r = Router();
  r.use(authMiddleware);
  r.get('/', async (req, res, next) => {
    try {
      const kpis = await getPortfolioKPIs(req.user!.id);
      res.json(kpis);
    } catch (err) { next(err); }
  });
  return r;
})();
```

### Wire into `src/index.ts`
```typescript
import investmentsRouter, { portfolioRouter } from './routes/investments';
app.use('/api/investments', investmentsRouter);
app.use('/api/portfolio', portfolioRouter);
```

## Cursor prompt

```
Implement backend/src/routes/investments.ts, schemas/investment.ts, and services/portfolio.ts matching the spec.
All endpoints under /api/investments and /api/portfolio require JWT auth via authMiddleware.
POST /api/investments validates: deal exists, deal is open, amount >= minimumTicket, amount <= remaining capacity.
When investment created, increment deal.raisedAmount in same transaction.
GET /api/portfolio returns aggregated KPIs computed in services/portfolio.ts.
```
