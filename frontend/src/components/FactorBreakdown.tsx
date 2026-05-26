import type { FactorScore } from '../types/recommendation';

/**
 * Renders a single factor row: weighted-contribution number on the left,
 * factor name + one-line explanation on the right. Used inside
 * RecommendationsPanel to show the top contributors per recommendation.
 */
export function FactorBreakdown({ factor }: { factor: FactorScore }) {
  return (
    <div className="flex items-start gap-2 text-[11px] leading-snug">
      <span className="text-brand-accent font-mono shrink-0 w-10 tabular-nums">
        +{factor.weightedScore.toFixed(2)}
      </span>
      <span className="text-text-primary min-w-0">
        <span className="text-text-secondary font-medium uppercase tracking-wide mr-1.5 text-[10px]">
          {factor.factorLabel}
        </span>
        <span>{factor.label}</span>
      </span>
    </div>
  );
}
