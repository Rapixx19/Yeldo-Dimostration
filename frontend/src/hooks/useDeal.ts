import { useEffect, useState } from 'react';
import { fetchDeal } from '../api/deals';
import type { Deal } from '../types/deal';

export function useDeal(slug: string | undefined) {
  const [data, setData] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);
    fetchDeal(slug)
      .then((deal) => {
        if (!cancelled) {
          setData(deal);
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
  }, [slug]);

  return { data, isLoading, error };
}
