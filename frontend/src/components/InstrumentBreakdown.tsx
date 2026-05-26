import type { Investment } from '../types/deal';
import { DonutChart, type DonutDatum } from './DonutChart';
import { instrumentAllocation } from '../lib/portfolioStats';
import { instrumentLabel } from '../lib/format';

const INSTRUMENT_COLORS: Record<string, string> = {
  senior_loan: '#1C2820',
  senior_debt: '#4A7C3A',
  mezzanine: '#A87432',
  secured_mezzanine: '#5A6B5F',
};

export function InstrumentBreakdown({ investments }: { investments: Investment[] }) {
  const allocation = instrumentAllocation(investments);
  const data: DonutDatum[] = Object.entries(allocation).map(([key, { amount, pct }]) => ({
    name: instrumentLabel(key),
    value: amount,
    pct,
    fill: INSTRUMENT_COLORS[key] ?? '#5A6B5F',
  }));

  return (
    <div className="bg-card border border-border-light rounded-lg p-5">
      <h3 className="font-medium text-brand-dark mb-4">Instrument breakdown</h3>
      <DonutChart data={data} emptyMessage="No instrument data yet." />
    </div>
  );
}
