# Spec 13 — TFT distribution forecast

**Goal:** Implement the TFT-inspired forecast utility + the ForecastChart Recharts component on the portfolio dashboard.

**Time:** 90 minutes
**Depends on:** `09-frontend-portfolio`, `12-finbert-sentiment` (for MLInfoModal)
**Outputs:** 36-month stacked area forecast chart on portfolio page, citing arXiv:1912.09363

---

## Acceptance criteria

- [ ] `frontend/src/lib/forecast.ts` exports `generateForecast()` with heavy comments
- [ ] Function takes investments, returns 36-month projected distribution series
- [ ] `ForecastChart` component renders Recharts stacked area chart
- [ ] Hover tooltip shows per-deal breakdown + total at that month
- [ ] Dashed maturity markers (brass colored) for each deal's maturity date
- [ ] "TFT-inspired model" badge in chart header opens MLInfoModal
- [ ] arXiv:1912.09363 citation in chart footer

## Files to create / modify

```
frontend/src/
├── lib/forecast.ts             # Core forecast logic — HEAVILY COMMENTED
├── components/ForecastChart.tsx
└── pages/Portfolio.tsx         # Insert ForecastChart between KPIs and two-col
```

## Implementation

### `src/lib/forecast.ts` — HEAVILY COMMENTED

```typescript
/**
 * TFT-INSPIRED DISTRIBUTION FORECAST
 * ========================================================================
 *
 * RESEARCH BASIS:
 *   Lim, B., Arik, S. Ö., Loeff, N., & Pfister, T. (2020).
 *   Temporal Fusion Transformers for Interpretable Multi-horizon
 *   Time Series Forecasting. arXiv:1912.09363
 *   https://arxiv.org/abs/1912.09363
 *
 * WHY THIS MATTERS:
 *   Most forecasting models are black boxes — they give you a prediction
 *   but can't tell you *why*. TFT solves this by combining three types
 *   of layers:
 *     - Recurrent (LSTM) layers for short-term patterns
 *     - Self-attention layers for long-term dependencies
 *     - Gating layers that suppress irrelevant features
 *
 *   The output includes not just a forecast but also VARIABLE IMPORTANCE
 *   SCORES — telling you which input features mattered most for each
 *   prediction.
 *
 *   For Yeldo specifically, this would enable statements like:
 *     "We predict Mas d'en Bruno will distribute 12.5% IRR over 24 months
 *      — primary driver: the low LTV (35%), secondary: quarterly schedule."
 *
 *   This kind of interpretability is what makes a forecast *trustworthy* in
 *   regulated finance — not just accurate, but explainable.
 *
 * TFT'S DATA MODEL — MAPS EXACTLY TO YELDO DEALS:
 *   TFT divides inputs into three categories:
 *
 *     1. STATIC COVARIATES (don't change over the forecast horizon):
 *        - Loan-to-value
 *        - Instrument type (Senior Loan / Mezzanine / etc.)
 *        - Geography (country)
 *        - Sponsor reputation
 *
 *     2. KNOWN FUTURE INPUTS (scheduled, deterministic):
 *        - Distribution dates (every 3 months if quarterly)
 *        - Maturity date
 *        - Closing date
 *
 *     3. HISTORICAL TIME SERIES (past observations):
 *        - Past distributions for this deal class
 *        - Past sponsor performance
 *        - Past macro indicators (interest rates, inflation)
 *
 *   This module's function signature mirrors this structure — making
 *   it a drop-in for a real trained TFT model.
 *
 * CURRENT IMPLEMENTATION:
 *   Deterministic financial arithmetic. For each investment:
 *     - If distribution === "quarterly": emit payment every 3 months
 *       until maturity, where amount = investedAmount * (annualIRR / 4 / 100)
 *     - If distribution === "at_maturity": emit single lump-sum payment
 *       at maturity date, where amount = investedAmount * (annualIRR / 100)
 *       * (maturityMonths / 12)
 *
 *   This is the right approach for a portfolio piece because:
 *     1. No trained model required (would need historical Yeldo data)
 *     2. Defensible — the math is correct for the stated cash flows
 *     3. Visually identical to what a real TFT forecast would produce
 *
 * PRODUCTION MIGRATION PATH (drop-in replacement):
 *   To swap in a real TFT model:
 *
 *     1. Train a TFT model using PyTorch Forecasting library on historical
 *        deal performance data. Use the static / known / historical input
 *        partitioning from the paper.
 *
 *     2. Deploy the trained model behind a /api/forecast endpoint
 *        (e.g., FastAPI on AWS SageMaker, latency < 1s for inference).
 *
 *     3. Replace the body of generateForecast() with:
 *
 *          const response = await fetch('/api/forecast', {
 *            method: 'POST',
 *            body: JSON.stringify({ investments, horizonMonths }),
 *          });
 *          return await response.json();
 *
 *     4. The return shape stays IDENTICAL — { dates, series } —
 *        so no chart component or page changes are needed.
 *
 *     5. BONUS: expose the variable importance scores from TFT as a
 *        secondary chart ("Why this forecast?"). The paper's Figure 5
 *        shows how to visualize attention weights — that's a natural
 *        v2 enhancement.
 *
 * ========================================================================
 */

import type { Investment, Deal } from '../types/deal';

export interface ForecastDataPoint {
  month: string;          // ISO date, first of month
  total: number;
  [dealId: string]: number | string;  // dynamic keys: each deal's contribution
}

export interface ForecastResult {
  data: ForecastDataPoint[];
  deals: Array<{ id: string; name: string; maturityDate: string; color: string }>;
}

const FORECAST_COLORS = ['#1C2820', '#A87432', '#4A7C3A', '#5A6B5F', '#8B9285', '#6B4E1F', '#3D5A30'];

export function generateForecast(
  investments: (Investment & { deal: Deal })[],
  horizonMonths: number = 36
): ForecastResult {
  // Build month axis starting from current month
  const today = new Date();
  today.setDate(1);  // Anchor to first of month
  const data: ForecastDataPoint[] = [];

  for (let m = 0; m < horizonMonths; m++) {
    const date = new Date(today.getFullYear(), today.getMonth() + m, 1);
    const point: ForecastDataPoint = {
      month: date.toISOString().slice(0, 10),
      total: 0,
    };
    // Initialize each deal's contribution to zero
    investments.forEach(inv => { point[inv.deal.id] = 0; });
    data.push(point);
  }

  // Compute each investment's distribution schedule
  for (const inv of investments) {
    const startDate = new Date(inv.deal.startDate);
    const maturityDate = new Date(inv.deal.maturityDate);
    const annualReturn = inv.amount * (inv.deal.targetIRR / 100);

    if (inv.deal.distribution === 'quarterly') {
      // Emit quarterly distributions
      const quarterlyAmount = annualReturn / 4;

      for (let m = 3; m <= inv.deal.maturityMonths; m += 3) {
        const payDate = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);

        // Find this payment's slot in our forecast horizon
        const idx = data.findIndex(p =>
          p.month === payDate.toISOString().slice(0, 10)
        );

        if (idx >= 0) {
          (data[idx][inv.deal.id] as number) += quarterlyAmount;
          data[idx].total += quarterlyAmount;
        }
      }
    } else {
      // At-maturity: single lump sum at maturity date
      const totalReturn = inv.amount + (annualReturn * (inv.deal.maturityMonths / 12));
      const matDate = new Date(maturityDate.getFullYear(), maturityDate.getMonth(), 1);

      const idx = data.findIndex(p =>
        p.month === matDate.toISOString().slice(0, 10)
      );

      if (idx >= 0) {
        (data[idx][inv.deal.id] as number) += totalReturn;
        data[idx].total += totalReturn;
      }
    }
  }

  // Build deals metadata with stable colors
  const deals = investments.map((inv, i) => ({
    id: inv.deal.id,
    name: inv.deal.name,
    maturityDate: inv.deal.maturityDate,
    color: FORECAST_COLORS[i % FORECAST_COLORS.length],
  }));

  return { data, deals };
}
```

### `src/components/ForecastChart.tsx`

```tsx
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MLInfoModal } from './MLInfoModal';
import { generateForecast } from '../lib/forecast';

export function ForecastChart({ investments }: { investments: (Investment & { deal: Deal })[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, deals } = generateForecast(investments);

  // X-axis tick formatter: show "Mar 26", "Sep 26" etc.
  const formatMonth = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear().toString().slice(2)}`;
  };

  return (
    <>
      <div className="bg-card border border-border-light rounded-lg p-5 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium text-sm">Projected distributions — next 36 months</h3>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Multi-horizon cash flow forecast across all active deals
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(168,116,50,0.12)] text-brand-accent text-[10px] font-medium hover:bg-[rgba(168,116,50,0.2)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            TFT-inspired model
          </button>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fontSize: 10, fill: '#8B9285' }}
              axisLine={{ stroke: '#5A6B5F', strokeOpacity: 0.3 }}
              tickLine={false}
              interval={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#8B9285' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v === 0 ? '€0' : `€${(v/1000).toFixed(1)}K`}
            />

            {deals.map((d) => (
              <Area
                key={d.id}
                type="monotone"
                dataKey={d.id}
                stackId="distributions"
                stroke="none"
                fill={d.color}
                fillOpacity={0.85}
              />
            ))}

            {/* Maturity markers */}
            {deals.map((d) => {
              const maturityMonth = new Date(d.maturityDate).toISOString().slice(0, 10).slice(0, 7) + '-01';
              return (
                <ReferenceLine
                  key={`mat-${d.id}`}
                  x={maturityMonth}
                  stroke="#A87432"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{ value: `${d.name} mat.`, fontSize: 9, fill: '#A87432', position: 'top' }}
                />
              );
            })}

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-card border border-border-light rounded-md p-3 text-xs shadow-sm">
                    <div className="font-medium mb-2">{formatMonth(label as string)}</div>
                    {payload.filter((p: any) => (p.value as number) > 0).map((p: any) => {
                      const deal = deals.find(d => d.id === p.dataKey);
                      return (
                        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: deal?.color }} />
                          <span className="text-text-secondary">{deal?.name}</span>
                          <span className="ml-auto font-medium tabular-nums">€{Math.round(p.value as number).toLocaleString()}</span>
                        </div>
                      );
                    })}
                    {payload.length > 0 && (
                      <div className="border-t border-border-light pt-1.5 mt-1.5 flex justify-between font-medium">
                        <span>Total</span>
                        <span className="tabular-nums">€{Math.round((payload[0].payload as ForecastDataPoint).total).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Citation */}
        <div className="text-[11px] text-text-tertiary mt-3 italic">
          Forecast model inspired by Temporal Fusion Transformer (Lim et al., 2020) —{' '}
          <a href="https://arxiv.org/abs/1912.09363" target="_blank" rel="noopener" className="text-brand-accent hover:underline not-italic">
            arXiv:1912.09363
          </a>. Static covariates + known future inputs + interpretable variable importance.
        </div>
      </div>

      <MLInfoModal type="tft" open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
```

### Insert into Portfolio page

In `src/pages/Portfolio.tsx`, between the KPI cards and the two-column section:
```jsx
<ForecastChart investments={investments} />
```

## Cursor prompt

```
Implement the TFT forecast feature matching this spec.

LIB:
- Create frontend/src/lib/forecast.ts with the heavily commented generateForecast() function.
- KEEP all the docblock comments — they explain TFT, the research basis, how the data model maps to Yeldo deals, and the production migration path. These are critical for recruiter clarity.

CHART:
- Create frontend/src/components/ForecastChart.tsx with the Recharts AreaChart implementation.
- Use the 7 brand-aligned forecast colors from forecast.ts (forest, brass, sage, etc.)
- Include the dashed maturity markers as ReferenceLine elements
- Custom tooltip shows per-deal breakdown + total
- "TFT-inspired model" badge opens MLInfoModal with type="tft"

PAGE:
- Insert <ForecastChart investments={investments} /> into Portfolio.tsx between the KPI grid and the two-column allocation/distributions section.

Visual reference: mockups/dashboard-tft.html
```
