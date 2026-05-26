import type { Investment } from '../types/deal';
import { formatEuro } from '../lib/format';

/**
 * Horizontal Gantt-style timeline of every investment, scaled to the
 * earliest start and latest maturity. A vertical "now" line shows current
 * position. Sorted by maturity ascending so the next-to-redeem deal is at
 * the top.
 */
export function LiquidityTimeline({ investments }: { investments: Investment[] }) {
  if (investments.length === 0) return null;

  const starts = investments.map((i) => new Date(i.deal.startDate).getTime());
  const maturities = investments.map((i) => new Date(i.deal.maturityDate).getTime());
  const tMin = Math.min(...starts);
  const tMax = Math.max(...maturities);
  const tNow = Date.now();
  const range = tMax - tMin || 1;
  const nowPct = ((tNow - tMin) / range) * 100;

  const sorted = [...investments].sort(
    (a, b) =>
      new Date(a.deal.maturityDate).getTime() - new Date(b.deal.maturityDate).getTime(),
  );

  return (
    <div className="bg-card border border-border-light rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-brand-dark">Liquidity timeline</h3>
        <span className="text-[11px] text-text-tertiary">
          {new Date(tMin).getFullYear()} → {new Date(tMax).getFullYear()}
        </span>
      </div>

      <div className="relative">
        <div
          className="absolute top-0 bottom-0 w-px bg-text-danger z-10"
          style={{ left: `calc(8rem + 0.75rem + ${Math.max(0, Math.min(100, nowPct))}%)` }}
          aria-label="current date"
        />
        <ul className="space-y-2">
          {sorted.map((inv) => {
            const start = new Date(inv.deal.startDate).getTime();
            const end = new Date(inv.deal.maturityDate).getTime();
            const leftPct = ((start - tMin) / range) * 100;
            const widthPct = Math.max(2, ((end - start) / range) * 100);
            const maturityLabel = new Date(inv.deal.maturityDate).toLocaleDateString('en-GB', {
              month: 'short',
              year: 'numeric',
            });
            return (
              <li key={inv.id} className="flex items-center gap-3 text-xs">
                <span className="w-32 shrink-0 truncate text-text-primary">{inv.deal.name}</span>
                <div className="flex-1 h-5 relative bg-soft rounded-sm">
                  <div
                    className="absolute h-full bg-brand-accent/40 rounded-sm border border-brand-accent/60"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${formatEuro(inv.amount)} · matures ${maturityLabel}`}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-text-secondary tabular-nums">
                  {maturityLabel}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 mt-3 text-[10px] text-text-tertiary">
          <span className="w-32 shrink-0" />
          <span className="flex-1 flex justify-between">
            <span>{new Date(tMin).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            <span className="flex items-center gap-1">
              <span className="w-px h-3 bg-text-danger" /> now
            </span>
            <span>
              {new Date(tMax).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </span>
          </span>
          <span className="w-20 shrink-0" />
        </div>
      </div>
    </div>
  );
}
