import { Link } from 'react-router-dom';
import { useRecommendations } from '../hooks/useRecommendations';
import { Flag } from './Flag';
import { SentimentChip } from './SentimentChip';
import { formatPercent } from '../lib/format';
import type { Recommendation } from '../types/recommendation';

export function RecommendationsPanel({ limit = 3 }: { limit?: number }) {
  const { data, isLoading } = useRecommendations(limit);

  return (
    <section className="bg-card border border-border-light rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-brand-dark">Recommended for you</h3>
          <p className="text-[11px] text-text-tertiary mt-0.5">
            Scored on diversification, risk, sentiment, and return — based on your current
            portfolio.
          </p>
        </div>
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
  const { deal, topReason } = rec;
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
        <SentimentChip label={deal.sentimentLabel} score={deal.sentimentScore} />
      </div>

      <div className="text-[11px] text-text-secondary mb-2">
        {deal.location} · {formatPercent(deal.targetIRR)} IRR · {deal.loanToValue}% LTV
      </div>

      <div className="inline-flex items-start gap-1.5 text-[11px] text-text-primary bg-soft rounded-md px-2 py-1.5">
        <span className="text-brand-accent font-medium uppercase tracking-wide text-[10px] mt-0.5">
          Why
        </span>
        <span className="leading-snug">{topReason}</span>
      </div>
    </Link>
  );
}
