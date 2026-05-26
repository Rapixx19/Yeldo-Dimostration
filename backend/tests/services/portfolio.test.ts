import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDeal, makeInvestment } from '../fixtures.js';

// vi.mock is hoisted to the top of the file, so this runs before the
// imports below. The factory returns an object that matches the shape
// of `import { prisma } from '../lib/prisma.js'` — the service under
// test gets this object instead of the real Prisma client.
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    investment: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
  },
}));

import { prisma } from '../../src/lib/prisma.js';
import { getPortfolioKPIs } from '../../src/services/portfolio.js';

const findManyInvestments = vi.mocked(prisma.investment.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getPortfolioKPIs', () => {
  it('returns zeroed KPIs for an empty portfolio', async () => {
    findManyInvestments.mockResolvedValue([]);
    const result = await getPortfolioKPIs('user-1');
    expect(result).toEqual({
      totalInvested: 0,
      weightedIRR: 0,
      projectedReturns: 0,
      activeDealsCount: 0,
      countryAllocation: {},
    });
  });

  it('sums total invested correctly across multiple investments', async () => {
    findManyInvestments.mockResolvedValue([
      makeInvestment({ amount: 12_000 }),
      makeInvestment({ amount: 8_000 }),
      makeInvestment({ amount: 5_000 }),
    ]);
    const result = await getPortfolioKPIs('user-1');
    expect(result.totalInvested).toBe(25_000);
  });

  it('computes amount-weighted IRR (not arithmetic mean)', async () => {
    // €10k at 10% IRR + €40k at 15% IRR
    // Amount-weighted: (10*10 + 40*15) / 50 = 700/50 = 14
    // Arithmetic: (10+15)/2 = 12.5 — would be wrong
    findManyInvestments.mockResolvedValue([
      makeInvestment({ amount: 10_000, deal: makeDeal({ targetIRR: 10 }) }),
      makeInvestment({ amount: 40_000, deal: makeDeal({ targetIRR: 15 }) }),
    ]);
    const result = await getPortfolioKPIs('user-1');
    expect(result.weightedIRR).toBe(14);
  });

  it('counts distinct deals, not investments', async () => {
    const deal = makeDeal({ id: 'shared-deal' });
    findManyInvestments.mockResolvedValue([
      makeInvestment({ deal, amount: 1_000 }),
      // Second investment in the same deal — should still count as 1 active deal
      makeInvestment({ deal, amount: 2_000 }),
      makeInvestment({ deal: makeDeal({ id: 'other-deal' }), amount: 3_000 }),
    ]);
    const result = await getPortfolioKPIs('user-1');
    expect(result.activeDealsCount).toBe(2);
  });

  it('country allocation percentages sum to ~100', async () => {
    findManyInvestments.mockResolvedValue([
      makeInvestment({ amount: 10_000, deal: makeDeal({ country: 'IT' }) }),
      makeInvestment({ amount: 7_500, deal: makeDeal({ country: 'ES' }) }),
      makeInvestment({ amount: 2_500, deal: makeDeal({ country: 'DE' }) }),
    ]);
    const result = await getPortfolioKPIs('user-1');
    const sum = Object.values(result.countryAllocation).reduce((s, a) => s + a.pct, 0);
    expect(sum).toBeCloseTo(100, 1);
    expect(result.countryAllocation.IT.pct).toBeCloseTo(50, 1);
    expect(result.countryAllocation.ES.pct).toBeCloseTo(37.5, 1);
    expect(result.countryAllocation.DE.pct).toBeCloseTo(12.5, 1);
  });

  it('computes projected returns from IRR × time correctly', async () => {
    // €100k at 10% IRR with 12-month maturity → €10k projected return
    findManyInvestments.mockResolvedValue([
      makeInvestment({
        amount: 100_000,
        deal: makeDeal({ targetIRR: 10, maturityMonths: 12 }),
      }),
    ]);
    const result = await getPortfolioKPIs('user-1');
    expect(result.projectedReturns).toBe(10_000);
  });

  it('queries by the provided userId', async () => {
    findManyInvestments.mockResolvedValue([]);
    await getPortfolioKPIs('user-xyz');
    expect(findManyInvestments).toHaveBeenCalledWith({
      where: { userId: 'user-xyz' },
      include: { deal: true },
    });
  });
});
