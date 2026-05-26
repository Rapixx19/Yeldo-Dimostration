import { DonutChart, type DonutDatum } from './DonutChart';
import { countryName } from '../lib/format';

const COUNTRY_COLORS: Record<string, string> = {
  IT: '#1C2820',
  ES: '#A87432',
  CH: '#4A7C3A',
  DE: '#5A6B5F',
  PT: '#8B9285',
};

export function CountryAllocation({
  allocation,
}: {
  allocation: Record<string, { amount: number; pct: number }>;
}) {
  const data: DonutDatum[] = Object.entries(allocation).map(([code, { amount, pct }]) => ({
    name: countryName(code),
    value: amount,
    pct,
    fill: COUNTRY_COLORS[code] ?? '#5A6B5F',
  }));

  return (
    <div className="bg-card border border-border-light rounded-lg p-5">
      <h3 className="font-medium text-brand-dark mb-4">Country allocation</h3>
      <DonutChart data={data} emptyMessage="Invest in a deal to see your country allocation." />
    </div>
  );
}
