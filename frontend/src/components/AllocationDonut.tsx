import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { countryName } from '../lib/format';

const COLORS: Record<string, string> = {
  IT: '#1C2820',
  ES: '#A87432',
  CH: '#4A7C3A',
  DE: '#5A6B5F',
  PT: '#8B9285',
};

interface Datum {
  name: string;
  value: number;
  pct: number;
  fill: string;
}

export function AllocationDonut({
  allocation,
}: {
  allocation: Record<string, { amount: number; pct: number }>;
}) {
  const data: Datum[] = Object.entries(allocation).map(([country, { amount, pct }]) => ({
    name: countryName(country),
    value: amount,
    pct,
    fill: COLORS[country] ?? '#5A6B5F',
  }));

  if (data.length === 0) {
    return (
      <div className="text-sm text-text-secondary py-6 text-center">
        Invest in a deal to see your country allocation.
      </div>
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
            <span>{d.name}</span>
            <span className="ml-auto text-text-secondary tabular-nums">{d.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
