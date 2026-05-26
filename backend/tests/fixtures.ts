import type { Deal, Investment } from '@prisma/client';

/**
 * Test fixtures — minimal-spec factories for Deal and Investment.
 *
 * Every test should declare only the fields that matter to the assertion;
 * everything else gets a sane default. This keeps individual tests focused
 * on one behavior at a time and avoids the "huge object literal in every
 * test" smell.
 */

let dealCounter = 0;
let investmentCounter = 0;

export function makeDeal(overrides: Partial<Deal> = {}): Deal {
  dealCounter += 1;
  const id = overrides.id ?? `deal-${dealCounter}`;
  return {
    id,
    slug: overrides.slug ?? id,
    name: overrides.name ?? `Test Deal ${dealCounter}`,
    location: 'Milan, Italy',
    country: 'IT',
    assetClass: 'Residential',
    instrument: 'senior_loan',
    targetRaise: 10_000_000,
    raisedAmount: 5_000_000,
    targetIRR: 10,
    maturityMonths: 24,
    loanToValue: 50,
    distribution: 'quarterly',
    minimumTicket: 100_000,
    status: 'open',
    startDate: new Date('2025-01-01'),
    maturityDate: new Date('2027-01-01'),
    closesAt: null,
    sentimentLabel: 'neutral',
    sentimentScore: 0.6,
    sentimentSignals: [],
    sponsorName: 'Test Sponsor',
    sponsorDescription: 'A sponsor.',
    hasFirstLienMortgage: true,
    risks: [],
    description: 'A test deal.',
    imageUrl: null,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function makeInvestment(
  overrides: Partial<Investment> & { deal?: Deal } = {},
): Investment & { deal: Deal } {
  investmentCounter += 1;
  const deal = overrides.deal ?? makeDeal();
  return {
    id: overrides.id ?? `inv-${investmentCounter}`,
    userId: overrides.userId ?? 'user-1',
    dealId: overrides.dealId ?? deal.id,
    amount: overrides.amount ?? 10_000,
    investedAt: overrides.investedAt ?? new Date('2026-01-01'),
    deal,
  };
}

/**
 * Reset counters between test files for deterministic IDs. Call from beforeEach
 * if a test asserts on specific IDs.
 */
export function resetCounters() {
  dealCounter = 0;
  investmentCounter = 0;
}
