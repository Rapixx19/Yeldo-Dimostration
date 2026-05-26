import { useEffect, useState } from 'react';
import { fetchRecentActivity } from '../api/activity';
import type { ActivityItem } from '../types/activity';

export function useRecentActivity(limit = 5) {
  const [data, setData] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecentActivity(limit)
      .then((list) => {
        if (!cancelled) {
          setData(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { data, isLoading, error };
}
