import type { Deal } from './deal';

export interface SemanticSearchResult {
  deal: Deal;
  similarity: number; // cosine similarity, [0, 1] — higher is more similar
}

export type SearchMode = 'keyword' | 'semantic';
