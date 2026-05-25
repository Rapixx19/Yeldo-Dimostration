import { prisma } from '../lib/prisma.js';

/**
 * Aggregated portfolio KPIs for a user.
 *
 * Computes:
 * - totalInvested  = SUM(amount across all investments)
 * - weightedIRR    = SUM(amount * deal.targetIRR) / SUM(amount)
 * - projectedReturns = SUM(amount * (deal.targetIRR/100) * (deal.maturityMonths/12))
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
      totalInvested: 0,
      weightedIRR: 0,
      projectedReturns: 0,
      activeDealsCount: 0,
      countryAllocation: {} as Record<string, { amount: number; pct: number }>,
    };
  }

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const weightedIRR =
    investments.reduce((s, i) => s + i.amount * i.deal.targetIRR, 0) / totalInvested;
  const projectedReturns = investments.reduce(
    (s, i) => s + i.amount * (i.deal.targetIRR / 100) * (i.deal.maturityMonths / 12),
    0,
  );

  const byCountry: Record<string, number> = {};
  for (const inv of investments) {
    byCountry[inv.deal.country] = (byCountry[inv.deal.country] ?? 0) + inv.amount;
  }
  const countryAllocation: Record<string, { amount: number; pct: number }> = {};
  for (const [country, amount] of Object.entries(byCountry)) {
    countryAllocation[country] = {
      amount,
      pct: parseFloat(((amount / totalInvested) * 100).toFixed(2)),
    };
  }

  return {
    totalInvested,
    weightedIRR: parseFloat(weightedIRR.toFixed(2)),
    projectedReturns: parseFloat(projectedReturns.toFixed(2)),
    activeDealsCount: new Set(investments.map((i) => i.dealId)).size,
    countryAllocation,
  };
}
