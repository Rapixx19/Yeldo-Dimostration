import type { Investment } from '../types/deal';
import { DonutChart, type DonutDatum } from './DonutChart';
import { assetClassAllocation } from '../lib/portfolioStats';

const ASSET_CLASS_COLORS: Record<string, string> = {
  Hospitality: '#A87432',
  Residential: '#1C2820',
  Industrial: '#5A6B5F',
  Commercial: '#4A7C3A',
  Vacation: '#8B9285',
};

export function AssetClassAllocation({ investments }: { investments: Investment[] }) {
  const allocation = assetClassAllocation(investments);
  const data: DonutDatum[] = Object.entries(allocation).map(([cls, { amount, pct }]) => ({
    name: cls,
    value: amount,
    pct,
    fill: ASSET_CLASS_COLORS[cls] ?? '#5A6B5F',
  }));

  return (
    <div className="bg-card border border-border-light rounded-lg p-5">
      <h3 className="font-medium text-brand-dark mb-4">Asset class allocation</h3>
      <DonutChart data={data} emptyMessage="No allocation data yet." />
    </div>
  );
}
