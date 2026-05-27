import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
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
            <DealCard key={deal.id} deal={deal} />
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
            <DealCard deal={deal} />
          </div>
        ))}
      </div>
    );
  }
}
