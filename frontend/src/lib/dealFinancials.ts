import type { Deal } from '../types/deal';

export type CashflowKind = 'invest' | 'coupon' | 'maturity';

export interface CashflowEvent {
  date: Date;
  kind: CashflowKind;
  /** Signed amount: negative for invest, positive for payouts. */
  amount: number;
}

/**
 * Subset of Deal needed to compute a hypothetical cashflow schedule.
 * Kept narrow so the helpers are easy to test without fabricating
 * an entire Deal fixture.
 */
export type CashflowDeal = Pick<
  Deal,
  'targetIRR' | 'maturityMonths' | 'distribution' | 'startDate' | 'maturityDate'
>;

/**
 * Build the chronological cashflow schedule for a hypothetical investment.
 *
 * Quarterly deals:
 *   - Initial outflow at startDate
 *   - One coupon every 3 months (mid-period coupons), each = amount × IRR/100 / 4
 *   - Final maturity event = quarterly coupon + principal returned
 *
 * At-maturity deals:
 *   - Initial outflow at startDate
 *   - Single maturity event = principal + accrued interest over the full period
 *
 * Returns events ordered by date, including both the outflow and inflows.
 * Sum of all amounts equals net profit (negative principal + all positive payouts).
 */
export function buildCashflowSchedule(amount: number, deal: CashflowDeal): CashflowEvent[] {
  const events: CashflowEvent[] = [];
  const start = new Date(deal.startDate);
  const maturity = new Date(deal.maturityDate);
  const annualCoupon = amount * (deal.targetIRR / 100);

  events.push({ date: start, kind: 'invest', amount: -amount });

  if (deal.distribution === 'quarterly') {
    const quarterly = annualCoupon / 4;
    const cursor = new Date(start);
    cursor.setMonth(cursor.getMonth() + 3);
    while (cursor < maturity) {
      events.push({ date: new Date(cursor), kind: 'coupon', amount: quarterly });
      cursor.setMonth(cursor.getMonth() + 3);
    }
    // Maturity event includes the final coupon plus the principal return.
    events.push({ date: maturity, kind: 'maturity', amount: quarterly + amount });
  } else {
    // at_maturity: principal + total interest at the end, no intermediate payments
    const totalInterest = annualCoupon * (deal.maturityMonths / 12);
    events.push({ date: maturity, kind: 'maturity', amount: amount + totalInterest });
  }

  return events;
}

/**
 * Net gain (positive cashflows minus initial outlay). For a deal with positive
 * IRR this will always be positive.
 */
export function totalReturn(events: CashflowEvent[]): number {
  return events.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Cumulative cashflow series suitable for an area chart. Starts at 0,
 * then descends to -amount on the invest date, then climbs back through
 * coupons and the maturity payout. Useful for showing the time-to-break-even
 * profile of the investment.
 */
export interface CumulativePoint {
  date: Date;
  cumulative: number;
}

export function cumulativeCashflow(events: CashflowEvent[]): CumulativePoint[] {
  let running = 0;
  return events.map((e) => {
    running += e.amount;
    return { date: e.date, cumulative: Math.round(running * 100) / 100 };
  });
}
