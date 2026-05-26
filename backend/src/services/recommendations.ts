import type { Deal } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// Weights — single source of truth for the recommendation algorithm.
// Each factor produces a raw score in [0, 1]. The final confidence is the
// weighted sum: confidence = Σ WEIGHTS[k] × factor_k. Weights must sum to 1.
// Surfaced as a constant at the top of the file so the algorithm is
// transparent to anyone reading the service.
// ---------------------------------------------------------------------------
export const WEIGHTS = {
  diversification: 0.35,
  risk: 0.25,
  returnPotential: 0.2,
  sentiment: 0.15,
  alignment: 0.05,
} as const;

export type FactorKey = keyof typeof WEIGHTS;

const FACTOR_LABELS: Record<FactorKey, string> = {
  diversification: 'Diversification',
  risk: 'Risk',
  returnPotential: 'Return',
  sentiment: 'Sentiment',
  alignment: 'Alignment',
};

export interface FactorScore {
  key: FactorKey;
  weight: number;          // from WEIGHTS
  rawScore: number;        // 0-1, this factor's raw signal
  weightedScore: number;   // weight × rawScore — contribution to total
  label: string;           // human-readable explanation of this factor
  factorLabel: string;     // human-readable factor name (e.g. 'Diversification')
}

export interface Recommendation {
  deal: Deal;
  confidence: number;       // weighted total, 0-1
  factors: FactorScore[];   // all 5, sorted by weightedScore desc
}

interface PortfolioSnapshot {
  countries: Set<string>;
  assetClasses: Set<string>;
  instruments: Set<string>;
  avgLTV: number;
  hasInvestments: boolean;
}

// ---------------------------------------------------------------------------
// Factor scorers — each returns a raw score in [0, 1] plus a one-line label
// explaining what drove that score. All scoring is continuous (no boolean
// flags) so e.g. LTV=15% scores higher than LTV=39%.
// ---------------------------------------------------------------------------

function scoreDiversification(
  deal: Deal,
  portfolio: PortfolioSnapshot,
): { rawScore: number; label: string } {
  if (!portfolio.hasInvestments) {
    return { rawScore: 0.5, label: 'No portfolio yet — broad allocation suggested' };
  }
  const countryNov = portfolio.countries.has(deal.country) ? 0 : 1;
  const assetNov = portfolio.assetClasses.has(deal.assetClass) ? 0 : 1;
  const instrNov = portfolio.instruments.has(deal.instrument) ? 0 : 1;
  const rawScore = 0.6 * countryNov + 0.3 * assetNov + 0.1 * instrNov;

  const parts: string[] = [];
  if (countryNov) parts.push(`${deal.country} — new country`);
  if (assetNov) parts.push(`${deal.assetClass} — new asset class`);
  if (instrNov) parts.push(`${prettyInstrument(deal.instrument)} — new instrument`);
  const label = parts.length === 0 ? 'Overlaps existing holdings' : parts.join(', ');
  return { rawScore, label };
}

function scoreRisk(deal: Deal): { rawScore: number; label: string } {
  const ltvScore = Math.max(0, 1 - deal.loanToValue / 100); // 0% LTV → 1.0, 100% → 0
  const lienScore = deal.hasFirstLienMortgage ? 1 : 0;
  const maturityScore = Math.max(0, 1 - deal.maturityMonths / 60); // 0mo → 1, 60mo → 0
  const rawScore = 0.5 * ltvScore + 0.3 * lienScore + 0.2 * maturityScore;

  const lien = deal.hasFirstLienMortgage ? 'first-lien' : 'unsecured';
  const label = `${deal.loanToValue}% LTV · ${lien} · ${deal.maturityMonths}mo`;
  return { rawScore, label };
}

function scoreReturnPotential(deal: Deal): { rawScore: number; label: string } {
  // Linear scale capped at 15% IRR. Above 15% saturates at 1.0; this stops
  // outliers (e.g. 25% IRR) from dominating the score purely on yield.
  const rawScore = Math.min(1, deal.targetIRR / 15);
  const label = `${deal.targetIRR.toFixed(1)}% target IRR`;
  return { rawScore, label };
}

function scoreSentiment(deal: Deal): { rawScore: number; label: string } {
  // FinBERT already produces a 0-1 confidence on the model's polarity
  // (bullish/neutral/cautious). We only reward bullish; neutral and cautious
  // do not penalize, they simply contribute less.
  const rawScore = deal.sentimentLabel === 'bullish' ? deal.sentimentScore : 0;
  const label = `FinBERT ${deal.sentimentLabel} (${Math.round(deal.sentimentScore * 100)}%)`;
  return { rawScore, label };
}

function scoreAlignment(
  deal: Deal,
  portfolio: PortfolioSnapshot,
): { rawScore: number; label: string } {
  // How close is this deal's LTV to the portfolio's amount-weighted average
  // LTV? Used as a "fits your risk profile" signal. Small weight (0.05) so
  // it nudges ties without dominating.
  if (!portfolio.hasInvestments) {
    return { rawScore: 0.5, label: 'No portfolio profile yet' };
  }
  const distance = Math.abs(deal.loanToValue - portfolio.avgLTV) / 100;
  const rawScore = Math.max(0, 1 - distance);
  const label = `Δ ${Math.abs(deal.loanToValue - portfolio.avgLTV).toFixed(0)}pts vs portfolio LTV`;
  return { rawScore, label };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getRecommendations(
  userId: string,
  limit = 3,
): Promise<Recommendation[]> {
  const [investments, allDeals] = await Promise.all([
    prisma.investment.findMany({ where: { userId }, include: { deal: true } }),
    prisma.deal.findMany({ where: { status: 'open' } }),
  ]);

  const ownedSlugs = new Set(investments.map((i) => i.deal.slug));
  const candidates = allDeals.filter((d) => !ownedSlugs.has(d.slug));
  if (candidates.length === 0) return [];

  const portfolio = buildPortfolioSnapshot(investments);

  const scored: Recommendation[] = candidates.map((deal) => {
    const factors: FactorScore[] = [
      makeFactor('diversification', scoreDiversification(deal, portfolio)),
      makeFactor('risk', scoreRisk(deal)),
      makeFactor('returnPotential', scoreReturnPotential(deal)),
      makeFactor('sentiment', scoreSentiment(deal)),
      makeFactor('alignment', scoreAlignment(deal, portfolio)),
    ];

    factors.sort((a, b) => b.weightedScore - a.weightedScore);
    const confidence = factors.reduce((s, f) => s + f.weightedScore, 0);

    return { deal, confidence, factors };
  });

  return scored.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPortfolioSnapshot(
  investments: Array<{ deal: Deal; amount: number }>,
): PortfolioSnapshot {
  if (investments.length === 0) {
    return {
      countries: new Set(),
      assetClasses: new Set(),
      instruments: new Set(),
      avgLTV: 0,
      hasInvestments: false,
    };
  }
  const totalAmount = investments.reduce((s, i) => s + i.amount, 0);
  const avgLTV = investments.reduce((s, i) => s + i.amount * i.deal.loanToValue, 0) / totalAmount;
  return {
    countries: new Set(investments.map((i) => i.deal.country)),
    assetClasses: new Set(investments.map((i) => i.deal.assetClass)),
    instruments: new Set(investments.map((i) => i.deal.instrument)),
    avgLTV,
    hasInvestments: true,
  };
}

function makeFactor(
  key: FactorKey,
  result: { rawScore: number; label: string },
): FactorScore {
  const weight = WEIGHTS[key];
  return {
    key,
    weight,
    rawScore: result.rawScore,
    weightedScore: weight * result.rawScore,
    label: result.label,
    factorLabel: FACTOR_LABELS[key],
  };
}

function prettyInstrument(key: string): string {
  return key.replace(/_/g, ' ');
}
