import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { useDealsLive } from '../hooks/useDealsLive';
import { useSemanticSearch } from '../hooks/useSemanticSearch';
import { DealCard } from '../components/DealCard';
import { FilterBar } from '../components/FilterBar';
import { SemanticSearchBox } from '../components/SemanticSearchBox';
import { StatsBar } from '../components/StatsBar';
import type { DealFilters } from '../types/deal';
import type { SearchMode } from '../types/search';

export function Discover() {
  const [filters, setFilters] = useState<DealFilters>({});
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<SearchMode>('keyword');
  const { data: deals, isLoading, error } = useDeals(filters);
  const semantic = useSemanticSearch(mode === 'semantic' ? search : '', 12);

  const keywordFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        d.sponsorName.toLowerCase().includes(q),
    );
  }, [deals, search]);

  // In semantic mode with a non-empty query: show ranked results with
  // similarity badges. Otherwise fall back to the keyword grid.
  const showSemantic = mode === 'semantic' && search.trim().length > 0;

  // Visible deals depend on mode. In semantic mode the visible set is
  // the semantic results; otherwise it's the keyword-filtered list.
  const visibleDeals = showSemantic
    ? semantic.data.map((r) => r.deal)
    : keywordFiltered;

  // Subscribe once for the whole grid — one Realtime channel covers
  // every visible deal via an IN-filter (see useDealsLive).
  const visibleIds = useMemo(() => visibleDeals.map((d) => d.id), [visibleDeals]);
  const initialRaised = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of visibleDeals) m[d.id] = d.raisedAmount;
    return m;
  }, [visibleDeals]);
  const live = useDealsLive(visibleIds, initialRaised);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-medium tracking-tight mb-1 text-brand-dark">Discover deals</h1>
      <p className="text-text-secondary text-sm mb-6">
        Curated real-estate investment opportunities across Europe.
      </p>

      <StatsBar />

      <SemanticSearchBox
        mode={mode}
        onModeChange={setMode}
        query={search}
        onQueryChange={setSearch}
        isLoading={semantic.isLoading}
      />

      {mode === 'keyword' && (
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          search={search}
          setSearch={setSearch}
        />
      )}

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary">Loading deals…</div>
      ) : error ? (
        <div className="py-16 text-center text-text-danger">
          Couldn&apos;t reach the backend. Is <code>VITE_API_URL</code> set correctly?
        </div>
      ) : showSemantic ? (
        <SemanticGrid />
      ) : keywordFiltered.length === 0 ? (
        <div className="py-16 text-center text-text-secondary">No deals match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keywordFiltered.map((deal) => (
            <DealCard key={deal.id} deal={deal} live={live[deal.id]} />
          ))}
        </div>
      )}
    </div>
  );

  function SemanticGrid() {
    if (semantic.isLoading && semantic.data.length === 0) {
      return <div className="py-16 text-center text-text-secondary">Searching…</div>;
    }
    if (semantic.error) {
      return (
        <div className="py-16 text-center text-text-danger">
          Semantic search is unavailable right now. Switch to keyword mode.
        </div>
      );
    }
    if (semantic.data.length === 0) {
      return (
        <div className="py-16 text-center text-text-secondary">
          No matches. Try a different phrasing or switch to keyword mode.
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semantic.data.map(({ deal, similarity }) => (
          <div key={deal.id} className="relative">
            <span className="absolute -top-2 left-3 z-10 bg-brand-dark text-page text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
              {Math.round(similarity * 100)}% match
            </span>
            <DealCard deal={deal} live={live[deal.id]} />
          </div>
        ))}
      </div>
    );
  }
}
