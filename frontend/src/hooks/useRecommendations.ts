import { useEffect, useState } from 'react';
import { fetchRecommendations } from '../api/recommendations';
import type { Recommendation } from '../types/recommendation';

export function useRecommendations(limit = 3) {
  const [data, setData] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecommendations(limit)
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
