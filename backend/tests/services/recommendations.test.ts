import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDeal, makeInvestment } from '../fixtures.js';

vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    investment: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
  },
}));

import { prisma } from '../../src/lib/prisma.js';
import { WEIGHTS, getRecommendations } from '../../src/services/recommendations.js';

const findManyInvestments = vi.mocked(prisma.investment.findMany);
const findManyDeals = vi.mocked(prisma.deal.findMany);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WEIGHTS invariant', () => {
  it('factor weights sum to exactly 1.0', () => {
    const total = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
    // Weights drive the confidence interpretation — if they don't sum to 1,
    // the confidence percentage on the UI lies. Cheap invariant, big value.
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('has all five named factors', () => {
    expect(Object.keys(WEIGHTS).sort()).toEqual([
      'alignment',
      'diversification',
      'returnPotential',
      'risk',
      'sentiment',
    ]);
  });
});

describe('getRecommendations', () => {
  it('returns an empty list when no candidate deals exist', async () => {
    findManyInvestments.mockResolvedValue([]);
    findManyDeals.mockResolvedValue([]);
    const result = await getRecommendations('user-1');
    expect(result).toEqual([]);
  });

  it('excludes deals the user already owns', async () => {
    const ownedDeal = makeDeal({ id: 'd-owned', slug: 'owned' });
    const unownedDeal = makeDeal({ id: 'd-unowned', slug: 'unowned' });
    findManyInvestments.mockResolvedValue([makeInvestment({ deal: ownedDeal })]);
    findManyDeals.mockResolvedValue([ownedDeal, unownedDeal]);

    const result = await getRecommendations('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].deal.slug).toBe('unowned');
  });

  it('respects the limit parameter', async () => {
    findManyInvestments.mockResolvedValue([]);
    findManyDeals.mockResolvedValue([
      makeDeal({ slug: 'a' }),
      makeDeal({ slug: 'b' }),
      makeDeal({ slug: 'c' }),
      makeDeal({ slug: 'd' }),
      makeDeal({ slug: 'e' }),
    ]);
    const result = await getRecommendations('user-1', 2);
    expect(result).toHaveLength(2);
  });

  it('ranks unowned-country deals above same-country deals (else equal)', async () => {
    // User holds IT. Candidates: IT (same country) and PT (new country).
    // Else-equal means: same IRR, LTV, instrument, sentiment, lien, maturity.
    const userDeal = makeDeal({ country: 'IT' });
    findManyInvestments.mockResolvedValue([makeInvestment({ deal: userDeal })]);

    const sameCountry = makeDeal({ id: 'a', slug: 'same', country: 'IT' });
    const newCountry = makeDeal({ id: 'b', slug: 'new', country: 'PT' });
    findManyDeals.mockResolvedValue([sameCountry, newCountry]);

    const result = await getRecommendations('user-1');
    // newCountry should come first because diversification factor fires (+0.21
    // when only country novelty applies: 0.35 weight × 0.6 country sub-weight)
    expect(result[0].deal.slug).toBe('new');
    expect(result[1].deal.slug).toBe('same');
  });

  it('the country-only diversification bonus equals weight × 0.6 (0.21)', async () => {
    // User has 1 IT/Residential/senior_loan deal. Candidate is same except country.
    // Only the country-novelty sub-factor of diversification should fire.
    findManyInvestments.mockResolvedValue([
      makeInvestment({
        deal: makeDeal({
          country: 'IT',
          assetClass: 'Residential',
          instrument: 'senior_loan',
        }),
      }),
    ]);
    findManyDeals.mockResolvedValue([
      makeDeal({
        id: 'pt-deal',
        slug: 'pt',
        country: 'PT', // novel
        assetClass: 'Residential', // same
        instrument: 'senior_loan', // same
      }),
    ]);

    const result = await getRecommendations('user-1');
    const diversification = result[0].factors.find((f) => f.key === 'diversification');
    // 0.35 weight × 0.6 country sub-weight = 0.21
    expect(diversification?.weightedScore).toBeCloseTo(0.21, 5);
  });

  it('factors are sorted by weightedScore descending within each recommendation', async () => {
    findManyInvestments.mockResolvedValue([]);
    findManyDeals.mockResolvedValue([makeDeal()]);
    const result = await getRecommendations('user-1');
    const scores = result[0].factors.map((f) => f.weightedScore);
    const sortedScores = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sortedScores);
  });

  it('confidence equals the sum of weighted factor scores', async () => {
    findManyInvestments.mockResolvedValue([]);
    findManyDeals.mockResolvedValue([makeDeal()]);
    const result = await getRecommendations('user-1');
    const summed = result[0].factors.reduce((s, f) => s + f.weightedScore, 0);
    expect(result[0].confidence).toBeCloseTo(summed, 5);
  });

  it('handles empty portfolio (cold-start case) without crashing', async () => {
    findManyInvestments.mockResolvedValue([]);
    findManyDeals.mockResolvedValue([
      makeDeal({ slug: 'a' }),
      makeDeal({ slug: 'b' }),
    ]);
    const result = await getRecommendations('user-1');
    expect(result).toHaveLength(2);
    // Diversification factor should still produce a non-error label for the
    // empty-portfolio case (currently labeled "No portfolio yet — broad allocation suggested").
    const diversification = result[0].factors.find((f) => f.key === 'diversification');
    expect(diversification?.label.toLowerCase()).toContain('no portfolio');
  });

  it('only considers open deals (filters via where status = open)', async () => {
    findManyInvestments.mockResolvedValue([]);
    findManyDeals.mockResolvedValue([]);
    await getRecommendations('user-1');
    // Verify the Prisma query was scoped to status: open
    expect(findManyDeals).toHaveBeenCalledWith({ where: { status: 'open' } });
  });

  it('confidence is always in [0, 1]', async () => {
    findManyInvestments.mockResolvedValue([]);
    // Extreme cases — adversarial values that would push score past bounds if uncapped
    findManyDeals.mockResolvedValue([
      makeDeal({
        loanToValue: 0,
        instrument: 'senior_loan',
        maturityMonths: 0,
        hasFirstLienMortgage: true,
        targetIRR: 100,
        sentimentLabel: 'bullish',
        sentimentScore: 1,
      }),
      makeDeal({
        loanToValue: 100,
        instrument: 'mezzanine',
        maturityMonths: 120,
        hasFirstLienMortgage: false,
        targetIRR: 0,
        sentimentLabel: 'cautious',
        sentimentScore: 0,
      }),
    ]);
    const result = await getRecommendations('user-1');
    for (const r of result) {
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    }
  });
});
