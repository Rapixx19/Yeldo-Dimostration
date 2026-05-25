import { useEffect, useState } from 'react';
import { fetchPortfolio } from '../api/investments';
import type { PortfolioKPIs } from '../types/deal';

export function usePortfolio() {
  const [data, setData] = useState<PortfolioKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolio()
      .then((kpis) => {
        if (!cancelled) {
          setData(kpis);
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
