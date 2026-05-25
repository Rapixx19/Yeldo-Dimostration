# Spec 09 — Frontend portfolio page

**Goal:** Build the `/portfolio` page with KPI cards, country allocation donut, upcoming distributions, and active investments table.

**Time:** 75 minutes
**Depends on:** `04-backend-investments-api`, `05-frontend-setup-with-tokens`
**Outputs:** Complete portfolio dashboard (TFT forecast chart added in Spec 13)

---

## Acceptance criteria

- [ ] Page fetches `GET /api/investments` and `GET /api/portfolio` on mount
- [ ] Welcome header with user name + total portfolio value
- [ ] 4 KPI cards: Total invested, Weighted IRR, Projected returns, Next distribution
- [ ] Allocation donut chart (Recharts PieChart) by country
- [ ] Upcoming distributions list (next 90 days) using forecast logic
- [ ] Active investments table with country flag, instrument pill, invested amount, IRR, maturity progress bar
- [ ] Empty state if user has no investments yet

## Files to create

```
frontend/src/
├── pages/Portfolio.tsx
├── components/
│   ├── KPICard.tsx
│   ├── AllocationDonut.tsx
│   ├── UpcomingDistributions.tsx
│   ├── InvestmentsTable.tsx
│   └── MaturityProgressBar.tsx
└── hooks/useInvestments.ts
```

## Implementation highlights

### `src/components/KPICard.tsx`
```jsx
export function KPICard({ label, value, footer, footerVariant }: KPIProps) {
  return (
    <div className="bg-soft rounded-md p-4">
      <div className="text-[11px] text-text-secondary uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
      {footer && (
        <div className={`text-xs mt-2 ${
          footerVariant === 'success' ? 'text-text-success font-medium' :
          footerVariant === 'accent' ? 'text-brand-accent font-medium' :
          'text-text-secondary'
        }`}>
          {footer}
        </div>
      )}
    </div>
  );
}
```

### `src/components/AllocationDonut.tsx`
```jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS: Record<string, string> = {
  IT: '#1C2820', ES: '#A87432', CH: '#4A7C3A',
  DE: '#5A6B5F', PT: '#8B9285',
};

export function AllocationDonut({ allocation }: { allocation: Record<string, { amount: number; pct: number }> }) {
  const data = Object.entries(allocation).map(([country, { amount, pct }]) => ({
    name: countryFullName(country),
    value: amount,
    pct,
    fill: COLORS[country] || '#5A6B5F',
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-5">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} innerRadius={45} outerRadius={65} dataKey="value">
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2.5 text-sm">
            <span className="w-2 h-2 rounded-sm" style={{ background: d.fill }} />
            <span>{d.name}</span>
            <span className="ml-auto text-text-secondary">{d.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### `src/components/InvestmentsTable.tsx`
```jsx
export function InvestmentsTable({ investments }: { investments: Investment[] }) {
  return (
    <div className="bg-card border border-border-light rounded-lg overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <h3 className="font-medium">Active investments</h3>
        <span className="text-[11px] text-text-tertiary">
          {investments.length} deals · weighted maturity {weightedMaturity(investments)} months
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-text-secondary text-[11px] uppercase tracking-wide">
            <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">Deal</th>
            <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">Instrument</th>
            <th className="text-right px-5 py-2.5 font-normal border-b border-border-light">Invested</th>
            <th className="text-right px-5 py-2.5 font-normal border-b border-border-light">IRR</th>
            <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">Maturity</th>
          </tr>
        </thead>
        <tbody>
          {investments.map(inv => (
            <tr key={inv.id} className="border-b border-border-light last:border-b-0 hover:bg-soft/40">
              <td className="px-5 py-3.5">
                <Link to={`/deals/${inv.deal.slug}`} className="flex items-center gap-2.5">
                  <Flag country={inv.deal.country} />
                  <span className="font-medium">{inv.deal.name}</span>
                </Link>
              </td>
              <td className="px-5 py-3.5">
                <InstrumentPill instrument={inv.deal.instrument} />
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums">
                €{inv.amount.toLocaleString()}
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums">
                {inv.deal.targetIRR}%
              </td>
              <td className="px-5 py-3.5">
                <MaturityProgressBar startDate={inv.deal.startDate} maturityMonths={inv.deal.maturityMonths} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Cursor prompt

```
Build frontend/src/pages/Portfolio.tsx and supporting components matching this spec.
Use mockups/dashboard-forest.html as the visual reference.
Fetch investments via GET /api/investments and KPIs via GET /api/portfolio.
The TFT forecast chart will be added in Spec 13 — leave a placeholder div above the two-column section for now.
KPI cards use the bg-soft background.
The donut chart uses Recharts PieChart with innerRadius=45, outerRadius=65, custom colors per country.
The investments table has hover effects and clickable rows that navigate to deal detail.
```
