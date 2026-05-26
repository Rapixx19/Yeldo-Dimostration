import type { Investment } from '../types/deal';
import { formatEuro } from '../lib/format';
import {
  avgTicket,
  couponsNext12Months,
  sentimentDistribution,
  weightedMaturity,
} from '../lib/portfolioStats';

export function CompositionMetrics({ investments }: { investments: Investment[] }) {
  const ticket = avgTicket(investments);
  const maturity = weightedMaturity(investments);
  const coupons = couponsNext12Months(investments);
  const sent = sentimentDistribution(investments);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Cell label="Avg ticket" value={formatEuro(ticket)} />
      <Cell label="Weighted maturity" value={`${maturity} mo`} />
      <Cell label="Coupons next 12m" value={formatEuro(coupons, { decimals: true })} />
      <Cell
        label="Sentiment"
        value={
          <span className="flex items-center gap-2 text-base">
            <Dot color="bg-text-success" /> {sent.bullish}
            <Dot color="bg-text-secondary" /> {sent.neutral}
            <Dot color="bg-text-warning" /> {sent.cautious}
          </span>
        }
      />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-card border border-border-light rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">{label}</div>
      <div className="text-xl font-medium text-brand-dark tabular-nums">{value}</div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}
