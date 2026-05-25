import { useEffect, useState } from 'react';
import { fetchDeals } from '../api/deals';
import type { Deal, DealFilters } from '../types/deal';

export function useDeals(filters: DealFilters = {}) {
  const [data, setData] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchDeals(filters)
      .then((deals) => {
        if (!cancelled) {
          setData(deals);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isLoading, error };
}
