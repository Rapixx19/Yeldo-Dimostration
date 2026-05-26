import type { Deal } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

type ReasonKey = 'diversification' | 'risk' | 'sentiment' | 'return';

interface ScoredReason {
  key: ReasonKey;
  weight: number;
  label: string;
}

export interface Recommendation {
  deal: Deal;
  score: number;
  topReason: string;
}

/**
 * Rules-based recommender. Scores every deal the user doesn't already hold
 * along four dimensions, then returns the top N with a single "why" tagline.
 *
 * Scoring weights are tuned so that diversification is the dominant factor
 * (max 1.0), then risk-adjusted features (max 0.5), then sentiment (max 0.3),
 * then return (max 0.2). The "top reason" is the highest-weight individual
 * factor — what an analyst would lead with in a one-line pitch.
 */
export async function getRecommendations(userId: string, limit = 3): Promise<Recommendation[]> {
  const [investments, allDeals] = await Promise.all([
    prisma.investment.findMany({ where: { userId }, include: { deal: true } }),
    prisma.deal.findMany({ where: { status: 'open' } }),
  ]);

  const ownedSlugs = new Set(investments.map((i) => i.deal.slug));
  const candidates = allDeals.filter((d) => !ownedSlugs.has(d.slug));
  if (candidates.length === 0) return [];

  const ownedCountries = new Set(investments.map((i) => i.deal.country));
  const ownedAssetClasses = new Set(investments.map((i) => i.deal.assetClass));
  const ownedInstruments = new Set(investments.map((i) => i.deal.instrument));

  const scored = candidates.map((deal) => {
    const reasons: ScoredReason[] = [];

    // Diversification (max 1.0)
    if (investments.length > 0 && !ownedCountries.has(deal.country)) {
      reasons.push({
        key: 'diversification',
        weight: 0.5,
        label: `Adds ${deal.country} exposure (you have 0%)`,
      });
    }
    if (investments.length > 0 && !ownedAssetClasses.has(deal.assetClass)) {
      reasons.push({
        key: 'diversification',
        weight: 0.3,
        label: `New asset class: ${deal.assetClass}`,
      });
    }
    if (investments.length > 0 && !ownedInstruments.has(deal.instrument)) {
      reasons.push({
        key: 'diversification',
        weight: 0.2,
        label: `New instrument: ${prettyInstrument(deal.instrument)}`,
      });
    }

    // Risk-adjusted features (max 0.5)
    if (deal.loanToValue < 40) {
      reasons.push({
        key: 'risk',
        weight: 0.3,
        label: `Low ${deal.loanToValue}% LTV provides strong coverage`,
      });
    }
    if (deal.hasFirstLienMortgage) {
      reasons.push({ key: 'risk', weight: 0.2, label: 'First-lien mortgage collateral' });
    }

    // Sentiment alignment (max 0.3)
    if (deal.sentimentLabel === 'bullish') {
      reasons.push({
        key: 'sentiment',
        weight: 0.3,
        label: `Bullish FinBERT sentiment (${Math.round(deal.sentimentScore * 100)}%)`,
      });
    }

    // Return (max 0.2)
    if (deal.targetIRR > 12) {
      reasons.push({
        key: 'return',
        weight: 0.2,
        label: `High target IRR ${deal.targetIRR.toFixed(1)}%`,
      });
    }

    const score = reasons.reduce((s, r) => s + r.weight, 0);
    reasons.sort((a, b) => b.weight - a.weight);
    const topReason = reasons[0]?.label ?? 'Open for investment';

    return { deal, score, topReason };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function prettyInstrument(key: string): string {
  return key.replace(/_/g, ' ');
}
