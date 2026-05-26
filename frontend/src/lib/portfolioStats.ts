import type { Instrument, Investment, SentimentLabel } from '../types/deal';

type AllocationMap = Record<string, { amount: number; pct: number }>;

function allocationByKey<K extends string>(
  investments: Investment[],
  keyOf: (i: Investment) => K,
): AllocationMap {
  const total = investments.reduce((s, i) => s + i.amount, 0);
  if (total === 0) return {};
  const byKey: Record<string, number> = {};
  for (const inv of investments) {
    const k = keyOf(inv);
    byKey[k] = (byKey[k] ?? 0) + inv.amount;
  }
  const out: AllocationMap = {};
  for (const [k, amount] of Object.entries(byKey)) {
    out[k] = { amount, pct: parseFloat(((amount / total) * 100).toFixed(2)) };
  }
  return out;
}

export function assetClassAllocation(investments: Investment[]): AllocationMap {
  return allocationByKey(investments, (i) => i.deal.assetClass);
}

export function instrumentAllocation(investments: Investment[]): AllocationMap {
  return allocationByKey(investments, (i) => i.deal.instrument as Instrument);
}

export interface Concentration {
  hhi: number;
  maxPositionPct: number;
  countries: number;
  assetClasses: number;
}

/**
 * Herfindahl-Hirschman concentration index on amount shares.
 *   HHI = Σ(share_i)^2, where share_i = amount_i / total_invested
 * Range: 1/N (perfectly diversified) to 1 (single position).
 */
export function concentrationMetrics(investments: Investment[]): Concentration {
  const total = investments.reduce((s, i) => s + i.amount, 0);
  if (total === 0) {
    return { hhi: 0, maxPositionPct: 0, countries: 0, assetClasses: 0 };
  }
  const shares = investments.map((i) => i.amount / total);
  const hhi = shares.reduce((s, sh) => s + sh * sh, 0);
  const maxPositionPct = Math.max(...shares) * 100;
  const countries = new Set(investments.map((i) => i.deal.country)).size;
  const assetClasses = new Set(investments.map((i) => i.deal.assetClass)).size;
  return { hhi: parseFloat(hhi.toFixed(3)), maxPositionPct, countries, assetClasses };
}

export function avgTicket(investments: Investment[]): number {
  if (investments.length === 0) return 0;
  const total = investments.reduce((s, i) => s + i.amount, 0);
  return total / investments.length;
}

export function weightedMaturity(investments: Investment[]): number {
  const total = investments.reduce((s, i) => s + i.amount, 0);
  if (total === 0) return 0;
  const w = investments.reduce((s, i) => s + i.amount * i.deal.maturityMonths, 0);
  return Math.round(w / total);
}

/**
 * Projected coupon income over the next 12 months across all investments.
 * Quarterly deals contribute their per-quarter coupon for each scheduled quarter
 * inside the window; at-maturity deals contribute their full coupon component
 * only if maturity falls within 12 months.
 */
export function couponsNext12Months(investments: Investment[]): number {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setMonth(horizon.getMonth() + 12);

  let total = 0;
  for (const inv of investments) {
    const start = new Date(inv.deal.startDate);
    const maturity = new Date(inv.deal.maturityDate);
    const annualCoupon = inv.amount * (inv.deal.targetIRR / 100);

    if (inv.deal.distribution === 'quarterly') {
      const quarter = annualCoupon / 4;
      const cursor = new Date(start);
      cursor.setMonth(cursor.getMonth() + 3);
      while (cursor < maturity) {
        if (cursor >= now && cursor <= horizon) total += quarter;
        cursor.setMonth(cursor.getMonth() + 3);
      }
    } else if (maturity >= now && maturity <= horizon) {
      total += annualCoupon * (inv.deal.maturityMonths / 12);
    }
  }
  return total;
}

export function sentimentDistribution(
  investments: Investment[],
): Record<SentimentLabel, number> {
  const dist: Record<SentimentLabel, number> = { bullish: 0, neutral: 0, cautious: 0 };
  for (const inv of investments) dist[inv.deal.sentimentLabel] += 1;
  return dist;
}
