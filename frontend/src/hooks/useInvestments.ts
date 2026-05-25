import { useEffect, useState } from 'react';
import { fetchInvestments } from '../api/investments';
import type { Investment } from '../types/deal';

export function useInvestments() {
  const [data, setData] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInvestments()
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
  }, []);

  return { data, isLoading, error };
}
