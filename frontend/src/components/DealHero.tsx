import type { Deal } from '../types/deal';
import { SentimentChip } from './SentimentChip';
import { Flag } from './Flag';
import { instrumentLabel } from '../lib/format';

export function DealHero({ deal }: { deal: Deal }) {
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
      <p className="text-sm text-page/80 flex items-center gap-2">
        <Flag country={deal.country} />
        {deal.location} · {deal.assetClass}
      </p>
    </section>
  );
}
