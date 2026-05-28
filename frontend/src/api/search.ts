import { api } from './client';
import type { SemanticSearchResult } from '../types/search';

export async function fetchSemanticSearch(
  query: string,
  limit = 5,
): Promise<SemanticSearchResult[]> {
  const { data } = await api.post<SemanticSearchResult[]>('/api/search', {
    query,
    limit,
  });
  return data;
}
