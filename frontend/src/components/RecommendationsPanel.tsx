import { Link } from 'react-router-dom';
import { useRecommendations } from '../hooks/useRecommendations';
import { Flag } from './Flag';
import { SentimentChip } from './SentimentChip';
import { FactorBreakdown } from './FactorBreakdown';
import { formatPercent } from '../lib/format';
import type { Recommendation } from '../types/recommendation';

const TOP_FACTORS = 3;

export function RecommendationsPanel({ limit = 3 }: { limit?: number }) {
  const { data, isLoading } = useRecommendations(limit);

  return (
    <section className="bg-card border border-border-light rounded-lg p-5">
      <div className="mb-4">
        <h3 className="font-medium text-brand-dark">Recommended for you</h3>
        <p className="text-[11px] text-text-tertiary mt-0.5">
          Weighted scoring across 5 factors — diversification (0.35), risk (0.25),
          return (0.20), sentiment (0.15), alignment (0.05). All scores are continuous;
          weights sum to 1.0 so confidence is interpretable as a percentage.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading recommendations…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No open deals available beyond your current portfolio.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.map((rec) => (
            <RecommendationCard key={rec.deal.id} rec={rec} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { deal, confidence, factors } = rec;
  const top = factors.slice(0, TOP_FACTORS);

  return (
    <Link
      to={`/deals/${deal.slug}`}
      className="block bg-page border border-border-light rounded-md p-3.5 hover:border-brand-accent transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <div
        className="h-16 mb-3 rounded-sm bg-brand-dark bg-cover bg-center relative"
        style={
          deal.imageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(28,40,32,0) 50%, rgba(28,40,32,0.55)), url(${deal.imageUrl})`,
              }
            : undefined
        }
      >
        <div className="absolute top-1.5 right-1.5">
          <Flag country={deal.country} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-medium text-text-primary text-sm truncate">{deal.name}</div>
        <span className="text-sm font-medium text-brand-dark tabular-nums shrink-0">
          {Math.round(confidence * 100)}%
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] text-text-secondary truncate">
          {deal.location} · {formatPercent(deal.targetIRR)} IRR · {deal.loanToValue}% LTV
        </span>
        <SentimentChip label={deal.sentimentLabel} score={deal.sentimentScore} />
      </div>

      <div className="border-t border-border-light pt-3 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5">
          Top contributors
        </div>
        {top.map((f) => (
          <FactorBreakdown key={f.key} factor={f} />
        ))}
      </div>
    </Link>
  );
}
