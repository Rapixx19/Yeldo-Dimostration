import type { DealFilters, Instrument } from '../types/deal';

interface FilterBarProps {
  filters: DealFilters;
  setFilters: (f: DealFilters) => void;
  search: string;
  setSearch: (s: string) => void;
}

const COUNTRIES: Array<{ code: string; label: string }> = [
  { code: '', label: 'All countries' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'DE', label: 'Germany' },
  { code: 'PT', label: 'Portugal' },
];

const INSTRUMENTS: Array<{ value: Instrument | ''; label: string }> = [
  { value: '', label: 'All instruments' },
  { value: 'senior_loan', label: 'Senior Loan' },
  { value: 'mezzanine', label: 'Mezzanine' },
  { value: 'senior_debt', label: 'Senior Debt' },
  { value: 'secured_mezzanine', label: 'Secured Mezzanine' },
];

export function FilterBar({ filters, setFilters, search, setSearch }: FilterBarProps) {
  return (
    <div className="bg-card border border-border-light rounded-lg p-3 mb-6 flex flex-wrap items-center gap-3">
      <input
        type="search"
        placeholder="Search deals…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 min-w-[180px] px-3 py-2 border border-border-light rounded-md bg-page text-sm"
        aria-label="Search deals"
      />

      <select
        value={filters.country ?? ''}
        onChange={(e) => setFilters({ ...filters, country: e.target.value || undefined })}
        className="px-3 py-2 border border-border-light rounded-md bg-page text-sm"
        aria-label="Filter by country"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code || 'all'} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={filters.instrument ?? ''}
        onChange={(e) =>
          setFilters({
            ...filters,
            instrument: (e.target.value as Instrument) || undefined,
          })
        }
        className="px-3 py-2 border border-border-light rounded-md bg-page text-sm"
        aria-label="Filter by instrument"
      >
        {INSTRUMENTS.map((i) => (
          <option key={i.value || 'all'} value={i.value}>
            {i.label}
          </option>
        ))}
      </select>

      <select
        value={
          filters.maturityMax !== undefined
            ? String(filters.maturityMax)
            : ''
        }
        onChange={(e) =>
          setFilters({
            ...filters,
            maturityMax: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        className="px-3 py-2 border border-border-light rounded-md bg-page text-sm"
        aria-label="Filter by maturity"
      >
        <option value="">Any maturity</option>
        <option value="18">≤ 18 months</option>
        <option value="36">≤ 36 months</option>
        <option value="60">≤ 60 months</option>
      </select>

      {(filters.country || filters.instrument || filters.maturityMax) && (
        <button
          onClick={() => setFilters({})}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
