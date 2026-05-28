import { useEffect, useState } from 'react';
import { fetchSemanticSearch } from '../api/search';
import type { SemanticSearchResult } from '../types/search';

const DEBOUNCE_MS = 400;

/**
 * Debounced semantic-search hook.
 *
 * Each keystroke would otherwise cost an OpenAI embedding call. Debouncing
 * by 400ms collapses a fast-typed query like "luxury alpine hotel" from
 * ~18 keystrokes to 1 call.
 *
 * Empty queries short-circuit to an empty result with no network round-trip.
 * Errors are swallowed (set to empty) — surfacing OpenAI/network errors to
 * the user is not useful; the keyword fallback mode is always available.
 */
export function useSemanticSearch(query: string, limit = 5) {
  const [data, setData] = useState<SemanticSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    let cancelled = false;

    const handle = setTimeout(() => {
      fetchSemanticSearch(trimmed, limit)
        .then((results) => {
          if (cancelled) return;
          setData(results);
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setData([]);
          setError(err);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, limit]);

  return { data, isLoading, error };
}
