import type { Deal } from '../types/deal';
import { buildCashflowSchedule, cumulativeCashflow, totalReturn } from '../lib/dealFinancials';
import { formatEuro, formatPercent } from '../lib/format';
import { DistributionSchedule } from './DistributionSchedule';
import { CashflowChart } from './CashflowChart';

/**
 * Per-deal financials tab. Three sections, each adding distinct value
 * over what the Overview tab shows:
 *
 *   1. Investment scenario — concrete numbers for "if you invest the minimum"
 *   2. Cumulative cashflow chart — time profile of returns
 *   3. Distribution schedule — every coupon + maturity payout with exact dates
 *
 * The example amount is the deal's minimum ticket so the math always
 * matches what a real investor at this deal would actually see.
 */
export function DealFinancials({ deal }: { deal: Deal }) {
  const exampleAmount = deal.minimumTicket;
  const events = buildCashflowSchedule(exampleAmount, deal);
  const cumulative = cumulativeCashflow(events);
  const netReturn = totalReturn(events);
  const grossPayout = exampleAmount + netReturn;

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border-light rounded-lg p-5">
        <h2 className="text-base font-medium text-brand-dark mb-1">Investment scenario</h2>
        <p className="text-[11px] text-text-tertiary mb-4">
          Example: invest the minimum ticket, hold to maturity.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Cell label="Invested" value={formatEuro(exampleAmount)} />
          <Cell
            label="Net return"
            value={formatEuro(netReturn, { decimals: true })}
            tone="success"
          />
          <Cell
            label="Gross payout"
            value={formatEuro(grossPayout, { decimals: true })}
            tone="primary"
          />
          <Cell label="Implied IRR" value={formatPercent(deal.targetIRR)} />
        </div>
      </section>

      <CashflowChart points={cumulative} />

      <DistributionSchedule events={events} />
    </div>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'primary';
}) {
  const valueClass =
    tone === 'success'
      ? 'text-text-success'
      : tone === 'primary'
        ? 'text-brand-dark'
        : 'text-text-primary';
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">{label}</div>
      <div className={`text-xl font-medium tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}
