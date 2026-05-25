# Spec 08 — Frontend deal detail page

**Goal:** Build the `/deals/:slug` page with hero, tabs, FinBERT widget, key terms, sponsor, risks, and sticky invest sidebar.

**Time:** 90 minutes
**Depends on:** `03-backend-deals-api`, `04-backend-investments-api`, `07-frontend-deals-list`
**Outputs:** Complete deal detail experience including virtual investment flow

---

## Acceptance criteria

- [ ] Page fetches deal via `GET /api/deals/:slug` on mount
- [ ] Hero: image background, instrument badge, sentiment chip, "Reserved to Professional Investors" badge, name, location, flag
- [ ] Tabs: Overview, Financials, Sponsor, Risks, Updates, Documents (only Overview is functional in v1)
- [ ] Investment summary text (from deal.description)
- [ ] FinBERT widget (see Spec 12 for full implementation)
- [ ] Key terms grid: 8 cards (Target raise, Target IRR, Maturity, LTV, Distribution, Min ticket, Currency, Collateral)
- [ ] Sponsor card with sponsor name + description
- [ ] Risk profile rows with severity dots (Low/Medium/High)
- [ ] Sticky right sidebar with invest form
- [ ] Invest form: amount input, quick-amount buttons, live projection summary, "Invest now" CTA
- [ ] Successful invest shows toast and navigates to `/portfolio`

## Files to create

```
frontend/src/
├── pages/DealDetailPage.tsx
├── components/
│   ├── DealHero.tsx
│   ├── DealTabs.tsx
│   ├── KeyTermsGrid.tsx
│   ├── SponsorCard.tsx
│   ├── RiskProfile.tsx
│   ├── InvestForm.tsx
│   ├── SentimentWidget.tsx          # (see Spec 12 for full impl)
│   └── MLInfoModal.tsx              # (see Spec 12 for FinBERT modal)
└── hooks/useDeal.ts
```

## Implementation highlights

### `src/pages/DealDetailPage.tsx`
```jsx
export function DealDetailPage() {
  const { slug } = useParams();
  const { data: deal, isLoading } = useDeal(slug!);
  const [activeTab, setActiveTab] = useState<TabName>('overview');

  if (isLoading || !deal) return <div className="py-16 text-center">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <Breadcrumb deal={deal} />
      <DealHero deal={deal} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-6 mt-6">
        <div>
          <DealTabs active={activeTab} onChange={setActiveTab} />
          {activeTab === 'overview' && <OverviewTab deal={deal} />}
          {/* Other tabs in v2 */}
        </div>
        <div>
          <InvestForm deal={deal} />
        </div>
      </div>
    </div>
  );
}
```

### `src/components/InvestForm.tsx`
```jsx
export function InvestForm({ deal }: { deal: Deal }) {
  const [amount, setAmount] = useState<number>(deal.minimumTicket);
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();
  const { token } = useAuth();

  const remaining = deal.targetRaise - deal.raisedAmount;
  const expectedReturn = amount * (deal.targetIRR / 100) * (deal.maturityMonths / 12);
  const quarterlyDist = amount * (deal.targetIRR / 100) / 4;

  const handleInvest = async () => {
    if (!token) {
      toast.error('Please sign in to invest');
      return nav('/auth/login');
    }
    if (amount < deal.minimumTicket) return toast.error(`Minimum ticket is €${deal.minimumTicket.toLocaleString()}`);
    if (amount > remaining) return toast.error(`Only €${remaining.toLocaleString()} remaining`);

    setSubmitting(true);
    try {
      await api.post('/api/investments', { dealId: deal.id, amount });
      toast.success('Investment confirmed');
      nav('/portfolio');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Investment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border-light rounded-lg p-5 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-text-success font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-success" />
          OPEN · {Math.round((deal.raisedAmount / deal.targetRaise) * 100)}% raised
        </span>
        <span className="text-[11px] text-text-secondary">closes in 23 days</span>
      </div>

      <div className="text-2xl font-medium tracking-tight">
        €{deal.raisedAmount.toLocaleString()}
      </div>
      <div className="text-xs text-text-secondary mb-3">
        raised of €{deal.targetRaise.toLocaleString()} target
      </div>

      <div className="w-full h-1.5 bg-soft rounded-full overflow-hidden mb-5">
        <div className="h-full bg-brand-accent" style={{ width: `${(deal.raisedAmount/deal.targetRaise)*100}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3 pb-5 mb-5 border-b border-border-light text-xs">
        <Stat label="Target IRR" value={`${deal.targetIRR}%`} valueClass="text-text-success" />
        <Stat label="Maturity" value={`${deal.maturityMonths} months`} />
        <Stat label="LTV" value={`${deal.loanToValue}%`} />
        <Stat label="Distribution" value={deal.distribution === 'quarterly' ? 'Quarterly' : 'At maturity'} />
      </div>

      <label className="block text-xs text-text-secondary mb-1.5">Investment amount (€)</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full px-3 py-3 border border-border-light rounded-md text-lg font-medium bg-card mb-2"
      />
      <div className="flex gap-1.5 mb-3">
        {[100000, 250000, 500000].map(a => (
          <button key={a} onClick={() => setAmount(a)}
                  className="flex-1 py-1.5 text-[11px] border border-border-light rounded-md hover:bg-soft">
            €{a/1000}K
          </button>
        ))}
        <button onClick={() => setAmount(remaining)}
                className="flex-1 py-1.5 text-[11px] border border-border-light rounded-md hover:bg-soft">
          Max
        </button>
      </div>

      <div className="bg-soft rounded-md p-3 mb-3 text-xs space-y-1">
        <Row label="Investment" value={`€${amount.toLocaleString('en-US', {minimumFractionDigits: 2})}`} />
        <Row label="Expected returns (IRR)" value={`€${expectedReturn.toLocaleString('en-US', {minimumFractionDigits: 2})}`} />
        {deal.distribution === 'quarterly' && (
          <Row label="Quarterly distribution" value={`€${quarterlyDist.toLocaleString('en-US', {minimumFractionDigits: 2})}`} />
        )}
        <div className="border-t border-border-light pt-2 mt-2 flex justify-between font-medium text-text-primary">
          <span>Total projected</span>
          <span>€{(amount + expectedReturn).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
        </div>
      </div>

      <button onClick={handleInvest} disabled={submitting}
              className="w-full py-3 bg-brand-dark text-page rounded-md font-medium disabled:opacity-50">
        {submitting ? 'Processing…' : 'Invest now'}
      </button>
      <p className="text-[11px] text-text-tertiary text-center mt-2">
        Virtual portfolio simulation. Reserved to professional investors as defined under FinSA Art. 4-5.
      </p>
    </div>
  );
}
```

## Cursor prompt

```
Build frontend/src/pages/DealDetailPage.tsx and supporting components matching this spec.
Use mockups/deal-detail-finbert.html as the visual reference for the page layout.
The Investment summary tab is functional in v1; other tabs (Financials, Sponsor, Risks, Updates, Documents) can show "Coming in v2" placeholder.
The InvestForm calculates expected returns and quarterly distribution LIVE as the user types in the amount input.
On invest, call POST /api/investments and on success show a success toast and navigate to /portfolio.
Use sticky positioning on the InvestForm so it stays visible as the user scrolls the main content.
```
