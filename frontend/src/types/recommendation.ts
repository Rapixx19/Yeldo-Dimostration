import type { Deal } from './deal';

export interface Recommendation {
  deal: Deal;
  score: number;
  topReason: string;
}
