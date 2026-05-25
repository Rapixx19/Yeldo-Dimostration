# Spec 07 — Frontend deals list (Discover page)

**Goal:** Build the `/discover` page with filter chips, search, and the deal card grid.

**Time:** 75 minutes
**Depends on:** `03-backend-deals-api`, `05-frontend-setup-with-tokens`
**Outputs:** Fully functional deal browsing page

---

## Acceptance criteria

- [ ] `/discover` fetches `GET /api/deals` on mount
- [ ] Stats bar shows: Total transacted, Financed deals, Historical IRR, Exited deals (use static values matching Yeldo's headline)
- [ ] Filter chips for Country, Asset class, Instrument, Maturity — clicking opens a dropdown
- [ ] Search input filters by deal name (client-side)
- [ ] Card grid: 3 columns desktop, 2 columns tablet, 1 column mobile
- [ ] Each card shows: hero image, country flag, professional-investor badge, instrument badge, name, location, 4 stats (Maturity, LTV, Distribution, Target IRR), raise progress bar, View deal CTA
- [ ] Each card has a small FinBERT sentiment chip (e.g., "● BULLISH 87%")
- [ ] Clicking a card or CTA navigates to `/deals/:slug`
- [ ] Empty state if no deals match filters

## Files to create

```
frontend/src/
├── pages/Discover.tsx
├── components/
│   ├── DealCard.tsx
│   ├── FilterBar.tsx
│   ├── FilterDropdown.tsx
│   ├── StatsBar.tsx
│   └── SentimentChip.tsx          # Small chip used on cards
├── hooks/useDeals.ts              # SWR or React Query for caching
├── lib/format.ts                  # Currency, percentage formatters
└── types/deal.ts                  # TypeScript types matching backend
```

## Implementation highlights

### `src/types/deal.ts`
```typescript
export type Instrument = 'senior_loan' | 'mezzanine' | 'senior_debt' | 'secured_mezzanine';
export type Distribution = 'quarterly' | 'at_maturity';
export type DealStatus = 'open' | 'closed' | 'exited';
export type SentimentLabel = 'bullish' | 'neutral' | 'cautious';

export interface Deal {
  id: string;
  slug: string;
  name: string;
  location: string;
  country: string;
  assetClass: string;
  instrument: Instrument;
  targetRaise: number;
  raisedAmount: number;
  targetIRR: number;
  maturityMonths: number;
  loanToValue: number;
  distribution: Distribution;
  minimumTicket: number;
  status: DealStatus;
  startDate: string;
  maturityDate: string;
  sentimentLabel: SentimentLabel;
  sentimentScore: number;
  sentimentSignals: { text: string; polarity: 'positive' | 'negative' }[];
  sponsorName: string;
  sponsorDescription: string;
  description: string;
  imageUrl?: string;
}
```

### `src/components/SentimentChip.tsx`
```jsx
export function SentimentChip({ label, score }: { label: SentimentLabel; score: number }) {
  const colors = {
    bullish: { bg: 'bg-[rgba(74,124,58,0.15)]', text: 'text-text-success' },
    neutral: { bg: 'bg-soft', text: 'text-text-secondary' },
    cautious: { bg: 'bg-[rgba(180,83,9,0.15)]', text: 'text-text-warning' },
  };
  const c = colors[label];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1 h-1 rounded-full ${label === 'bullish' ? 'bg-text-success' : label === 'cautious' ? 'bg-text-warning' : 'bg-text-secondary'}`} />
      {label.toUpperCase()} {Math.round(score * 100)}%
    </span>
  );
}
```

### `src/components/DealCard.tsx`
```jsx
export function DealCard({ deal }: { deal: Deal }) {
  const raisePct = (deal.raisedAmount / deal.targetRaise) * 100;
  const instrumentLabel = {
    senior_loan: 'Senior Loan', mezzanine: 'Mezzanine Loan',
    senior_debt: 'Senior Debt', secured_mezzanine: 'Secured Mezzanine',
  }[deal.instrument];

  return (
    <Link to={`/deals/${deal.slug}`} className="block bg-card border border-border-light rounded-lg overflow-hidden hover:border-brand-accent transition">
      {/* Hero */}
      <div className="h-36 relative bg-brand-dark p-3 flex items-end">
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span className="bg-page text-brand-dark px-2 py-0.5 rounded-full text-[10px] font-medium">
            Reserved to Professional Investors
          </span>
          <Flag country={deal.country} />
        </div>
        <span className="bg-page text-brand-dark px-2 py-0.5 rounded text-[11px] font-medium">
          {instrumentLabel}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-medium">{deal.name}</h3>
          <SentimentChip label={deal.sentimentLabel} score={deal.sentimentScore} />
        </div>
        <p className="text-xs text-text-secondary mb-4">
          {deal.location} · {deal.assetClass}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <Stat label="Maturity" value={`${deal.maturityMonths} months`} />
          <Stat label="Loan-to-value" value={`${deal.loanToValue}%`} />
          <Stat label="Distribution" value={deal.distribution === 'quarterly' ? 'Quarterly' : 'At maturity'} />
          <Stat label="Target IRR" value={`${deal.targetIRR}%`} />
        </div>

        {/* Raise progress */}
        <div className="w-full h-1 bg-soft rounded-full overflow-hidden mb-2">
          <div className="h-full bg-text-success" style={{ width: `${Math.min(raisePct, 100)}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-text-secondary mb-3">
          <span>Raised</span>
          <span className="font-medium text-text-primary">
            €{(deal.raisedAmount / 1e6).toFixed(1)}M / €{(deal.targetRaise / 1e6).toFixed(1)}M
          </span>
        </div>

        <button className="w-full py-2 bg-brand-dark text-page rounded-md text-sm font-medium">
          View deal
        </button>
      </div>
    </Link>
  );
}
```

### `src/pages/Discover.tsx`
```jsx
export function Discover() {
  const [filters, setFilters] = useState<DealFilters>({});
  const [search, setSearch] = useState('');
  const { data: deals = [], isLoading } = useDeals(filters);

  const filtered = useMemo(() =>
    deals.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [deals, search]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-medium mb-1">Discover deals</h1>
      <p className="text-text-secondary text-sm mb-6">
        Curated real estate investment opportunities across Europe
      </p>

      <StatsBar />
      <FilterBar filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} />

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary">Loading deals…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-text-secondary">No deals match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(deal => <DealCard key={deal.id} deal={deal} />)}
        </div>
      )}
    </div>
  );
}
```

## Cursor prompt

```
Build frontend/src/pages/Discover.tsx and supporting components (DealCard, FilterBar, FilterDropdown, StatsBar, SentimentChip) matching the spec.
Use the existing mockups/deals-list.html as a visual reference.
Fetch deals from GET /api/deals via the api client.
Client-side filtering for search; server-side filtering for filter chips (re-fetch on filter change).
Each DealCard shows the FinBERT SentimentChip — pull sentimentLabel and sentimentScore from the deal response.
Use react-router Link for navigation, not full page reloads.
```
