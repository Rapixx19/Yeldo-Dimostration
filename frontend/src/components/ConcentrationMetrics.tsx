import type { Investment } from '../types/deal';
import { concentrationMetrics } from '../lib/portfolioStats';

export function ConcentrationMetrics({ investments }: { investments: Investment[] }) {
  const m = concentrationMetrics(investments);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Cell
        label="HHI"
        value={m.hhi.toFixed(3)}
        tooltip="Herfindahl-Hirschman Index: sum of squared portfolio shares. 1/N = perfectly diversified, 1 = single position."
      />
      <Cell
        label="Max position"
        value={`${m.maxPositionPct.toFixed(1)}%`}
        tooltip="Largest single investment as % of total invested."
      />
      <Cell label="Countries" value={String(m.countries)} />
      <Cell label="Asset classes" value={String(m.assetClasses)} />
    </div>
  );
}

function Cell({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div className="bg-card border border-border-light rounded-lg p-4" title={tooltip}>
      <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">{label}</div>
      <div className="text-xl font-medium text-brand-dark tabular-nums">{value}</div>
    </div>
  );
}
