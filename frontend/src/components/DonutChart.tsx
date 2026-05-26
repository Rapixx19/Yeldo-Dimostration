import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface DonutDatum {
  name: string;
  value: number;
  pct: number;
  fill: string;
}

/**
 * Pure donut + legend presentation. Caller prepares the data (label + color)
 * so the same primitive serves country / asset-class / instrument splits.
 */
export function DonutChart({
  data,
  emptyMessage,
}: {
  data: DonutDatum[];
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-text-secondary py-6 text-center">{emptyMessage}</div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <div className="w-[140px] h-[140px] shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} innerRadius={45} outerRadius={65} dataKey="value">
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) =>
                `€${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-2.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5 text-sm text-text-primary">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.fill }} />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto text-text-secondary tabular-nums">{d.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
