import { useMemo } from 'react';
import type { Deal } from '../types/deal';
import { SentimentChip } from './SentimentChip';
import { Flag } from './Flag';
import { useDealsLive } from '../hooks/useDealsLive';
import { formatCompactEuro, instrumentLabel } from '../lib/format';

export function DealHero({ deal }: { deal: Deal }) {
  // Single-deal Realtime subscription. The hook accepts an array
  // because Discover uses it for many deals at once; on the detail
  // page we hand it a single-element array. One channel, scoped to
  // exactly this deal's row.
  const dealIds = useMemo(() => [deal.id], [deal.id]);
  const initial = useMemo(() => ({ [deal.id]: deal.raisedAmount }), [deal.id, deal.raisedAmount]);
  const live = useDealsLive(dealIds, initial);
  const raisedAmount = live[deal.id]?.raisedAmount ?? deal.raisedAmount;
  const pulsing = !!live[deal.id]?.pulsing;
  const raisePct = Math.min(100, (raisedAmount / deal.targetRaise) * 100);
  const isActivelyRaising = deal.status === 'open' && raisedAmount < deal.targetRaise;

  return (
    <section
      className="relative rounded-xl overflow-hidden bg-brand-dark text-page p-6 md:p-8 mb-6"
      style={
        deal.imageUrl
          ? {
              backgroundImage: `linear-gradient(rgba(28,40,32,0.65), rgba(28,40,32,0.85)), url(${deal.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="bg-page text-brand-dark px-2.5 py-1 rounded-full text-[10px] font-medium">
          Reserved to Professional Investors
        </span>
        <span className="bg-page text-brand-dark px-2.5 py-1 rounded text-[11px] font-medium">
          {instrumentLabel(deal.instrument)}
        </span>
        <SentimentChip label={deal.sentimentLabel} score={deal.sentimentScore} />
      </div>

      <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">{deal.name}</h1>
      <p className="text-sm text-page/80 flex items-center gap-2 mb-5">
        <Flag country={deal.country} />
        {deal.location} · {deal.assetClass}
      </p>

      <div className="bg-page/10 border border-page/15 backdrop-blur-sm rounded-md p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-page/70 flex items-center gap-2">
            Raise progress
            {isActivelyRaising && (
              <span
                className={`inline-flex items-center gap-1 text-page font-medium ${pulsing ? 'animate-pulse' : ''}`}
                aria-label="actively raising — live updates"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-text-danger" />
                LIVE
              </span>
            )}
          </span>
          <span className="text-sm font-medium tabular-nums">
            {formatCompactEuro(raisedAmount)} / {formatCompactEuro(deal.targetRaise)}
          </span>
        </div>
        <div className="w-full h-1.5 bg-page/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-text-success transition-[width] duration-700 ease-out"
            style={{ width: `${raisePct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
