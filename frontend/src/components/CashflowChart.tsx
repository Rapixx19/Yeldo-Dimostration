import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CumulativePoint } from '../lib/dealFinancials';
import { formatEuro } from '../lib/format';

interface ChartPoint {
  label: string;
  cumulative: number;
}

/**
 * Cumulative cashflow chart. X-axis is time, Y-axis is your running balance.
 * The curve dives to −investment at the start and climbs through coupons
 * until the maturity payout flips it positive.
 *
 * A ReferenceLine at y=0 makes the break-even moment visually obvious.
 */
export function CashflowChart({ points }: { points: CumulativePoint[] }) {
  const data: ChartPoint[] = points.map((p) => ({
    label: p.date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
    cumulative: p.cumulative,
  }));

  return (
    <div className="bg-card border border-border-light rounded-lg p-5">
      <h3 className="font-medium text-brand-dark mb-1">Cumulative cashflow</h3>
      <p className="text-[11px] text-text-tertiary mb-4">
        Running balance over the deal lifecycle. Starts negative (capital out), climbs through
        coupons, breaks even at the maturity payout.
      </p>
      <div className="w-full h-[200px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={11} />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={11}
              tickFormatter={(v: number) => formatEuro(v)}
            />
            <Tooltip
              formatter={(v: number) => formatEuro(v, { decimals: true })}
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                fontSize: 12,
              }}
            />
            <ReferenceLine y={0} stroke="var(--text-tertiary)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#4A7C3A"
              fill="#4A7C3A"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
