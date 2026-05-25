import { api } from './client';
import type { Deal, DealFilters } from '../types/deal';

export async function fetchDeals(filters: DealFilters = {}): Promise<Deal[]> {
  const params: Record<string, string | number> = {};
  if (filters.country) params.country = filters.country;
  if (filters.instrument) params.instrument = filters.instrument;
  if (filters.status) params.status = filters.status;
  if (filters.maturityMin !== undefined) params.maturityMin = filters.maturityMin;
  if (filters.maturityMax !== undefined) params.maturityMax = filters.maturityMax;

  const { data } = await api.get<Deal[]>('/api/deals', { params });
  return data;
}

export async function fetchDeal(slug: string): Promise<Deal> {
  const { data } = await api.get<Deal>(`/api/deals/${slug}`);
  return data;
}
