import type { Investment, SentimentLabel } from '../types/deal';

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
