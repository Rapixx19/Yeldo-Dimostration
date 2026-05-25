import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import type { Investment } from '../types/deal';
import { generateForecast, type ForecastDataPoint, type ForecastDealMeta } from '../lib/forecast';
import { MLInfoModal } from './MLInfoModal';

function formatMonth(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  return `${month} ${String(d.getUTCFullYear()).slice(2)}`;
}

function formatEuroAxis(v: number): string {
  if (v === 0) return '€0';
  if (Math.abs(v) >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `€${(v / 1_000).toFixed(1)}K`;
  return `€${v.toFixed(0)}`;
}

interface ForecastTooltipProps extends TooltipProps<number, string> {
  deals: ForecastDealMeta[];
}

function ForecastTooltip({ active, payload, label, deals }: ForecastTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as ForecastDataPoint | undefined;
  return (
    <div className="bg-card border border-border-light rounded-md p-3 text-xs shadow-sm">
      <div className="font-medium mb-2 text-text-primary">{formatMonth(String(label ?? ''))}</div>
      {payload
        .filter((p) => typeof p.value === 'number' && p.value > 0)
        .map((p) => {
          const deal = deals.find((d) => d.id === p.dataKey);
          return (
            <div key={String(p.dataKey)} className="flex items-center gap-2 py-0.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: deal?.color }} />
              <span className="text-text-secondary">{deal?.name ?? String(p.dataKey)}</span>
              <span className="ml-auto font-medium tabular-nums text-text-primary">
                €{Math.round(Number(p.value)).toLocaleString('en-US')}
              </span>
            </div>
          );
        })}
      {point && (
        <div className="border-t border-border-light pt-1.5 mt-1.5 flex justify-between font-medium text-text-primary">
          <span>Total</span>
          <span className="tabular-nums">€{Math.round(point.total).toLocaleString('en-US')}</span>
        </div>
      )}
    </div>
  );
}

export function ForecastChart({ investments }: { investments: Investment[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, deals } = useMemo(() => generateForecast(investments), [investments]);

  if (investments.length === 0) {
    return (
      <div className="bg-card border border-border-light rounded-lg p-6 mb-6 text-sm text-text-secondary text-center">
        Invest in a deal to see your TFT-inspired multi-horizon forecast.
      </div>
    );
  }

  return (
    <>
      <section className="bg-card border border-border-light rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium text-sm text-brand-dark">
              Projected distributions — next 36 months
            </h3>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Multi-horizon cash-flow forecast across all active deals
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            onMouseEnter={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(168,116,50,0.12)] text-brand-accent text-[10px] font-medium hover:bg-[rgba(168,116,50,0.2)]"
            aria-label="What is the TFT-inspired model?"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            TFT-inspired model
          </button>
        </div>

        <ResponsiveContainer width="100%" height={260}>
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
              tickFormatter={formatEuroAxis}
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
                isAnimationActive={false}
              />
            ))}

            {deals.map((d) => {
              const matDate = new Date(d.maturityDate);
              const matKey =
                `${matDate.getUTCFullYear()}-${String(matDate.getUTCMonth() + 1).padStart(2, '0')}-01`;
              return (
                <ReferenceLine
                  key={`mat-${d.id}`}
                  x={matKey}
                  stroke="#A87432"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  label={{
                    value: `${d.name} mat.`,
                    fontSize: 9,
                    fill: '#A87432',
                    position: 'top',
                  }}
                />
              );
            })}

            <Tooltip content={<ForecastTooltip deals={deals} />} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-text-secondary">
          {deals.map((d) => (
            <div key={d.id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
              <span>{d.name}</span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-text-tertiary mt-3 italic leading-relaxed">
          Forecast model inspired by Temporal Fusion Transformer (Lim et al., 2020) —{' '}
          <a
            href="https://arxiv.org/abs/1912.09363"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-accent hover:underline not-italic"
          >
            arXiv:1912.09363
          </a>
          . Static covariates + known future inputs + interpretable variable importance.
        </div>
      </section>

      <MLInfoModal type="tft" open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
