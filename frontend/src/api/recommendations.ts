import { api } from './client';
import type { Recommendation } from '../types/recommendation';

export async function fetchRecommendations(limit = 3): Promise<Recommendation[]> {
  const { data } = await api.get<Recommendation[]>('/api/recommendations', {
    params: { limit },
  });
  return data;
}
