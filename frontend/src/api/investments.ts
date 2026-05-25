import { api } from './client';
import type { Investment, PortfolioKPIs } from '../types/deal';

export async function fetchInvestments(): Promise<Investment[]> {
  const { data } = await api.get<Investment[]>('/api/investments');
  return data;
}

export async function fetchPortfolio(): Promise<PortfolioKPIs> {
  const { data } = await api.get<PortfolioKPIs>('/api/portfolio');
  return data;
}

export async function createInvestment(dealId: string, amount: number): Promise<Investment> {
  const { data } = await api.post<Investment>('/api/investments', { dealId, amount });
  return data;
}
