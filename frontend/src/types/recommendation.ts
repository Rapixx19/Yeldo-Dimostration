import type { Deal } from './deal';

export type FactorKey =
  | 'diversification'
  | 'risk'
  | 'returnPotential'
  | 'sentiment'
  | 'alignment';

export interface FactorScore {
  key: FactorKey;
  weight: number;          // from WEIGHTS — sums to 1.0 across all factors
  rawScore: number;        // this factor's raw signal, 0-1
  weightedScore: number;   // weight × rawScore — contribution to confidence
  label: string;           // human-readable explanation of what drove the score
  factorLabel: string;     // pretty factor name (e.g. "Diversification")
}

export interface Recommendation {
  deal: Deal;
  confidence: number;       // weighted sum of all factors, 0-1
  factors: FactorScore[];   // all 5 factors, sorted by weightedScore desc
}
