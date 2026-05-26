import { api } from './client';
import type { ActivityItem } from '../types/activity';

export async function fetchRecentActivity(limit = 5): Promise<ActivityItem[]> {
  const { data } = await api.get<ActivityItem[]>('/api/activity/recent', {
    params: { limit },
  });
  return data;
}

export async function fetchActivityById(investmentId: string): Promise<ActivityItem> {
  const { data } = await api.get<ActivityItem>(`/api/activity/${investmentId}`);
  return data;
}
