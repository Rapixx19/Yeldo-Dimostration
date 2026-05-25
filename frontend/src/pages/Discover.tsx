import { useMemo, useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { DealCard } from '../components/DealCard';
import { FilterBar } from '../components/FilterBar';
import { StatsBar } from '../components/StatsBar';
import type { DealFilters } from '../types/deal';

export function Discover() {
  const [filters, setFilters] = useState<DealFilters>({});
  const [search, setSearch] = useState('');
  const { data: deals, isLoading, error } = useDeals(filters);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        d.sponsorName.toLowerCase().includes(q),
    );
  }, [deals, search]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-medium tracking-tight mb-1 text-brand-dark">Discover deals</h1>
      <p className="text-text-secondary text-sm mb-6">
        Curated real-estate investment opportunities across Europe.
      </p>

      <StatsBar />
      <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary">Loading deals…</div>
      ) : error ? (
        <div className="py-16 text-center text-text-danger">
          Couldn&apos;t reach the backend. Is <code>VITE_API_URL</code> set correctly?
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-text-secondary">No deals match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
