import type { Investment } from '../types/deal';
import { formatEuro } from '../lib/format';

interface Distribution {
  date: Date;
  dealName: string;
  amount: number;
  kind: 'quarterly' | 'maturity';
}

const DAYS_HORIZON = 90;

function quarterlyDates(start: Date, maturity: Date): Date[] {
  const out: Date[] = [];
  const cursor = new Date(start);
  cursor.setMonth(cursor.getMonth() + 3);
  while (cursor < maturity) {
    out.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 3);
  }
  return out;
}

export function UpcomingDistributions({ investments }: { investments: Investment[] }) {
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + DAYS_HORIZON);

  const upcoming: Distribution[] = [];
  for (const inv of investments) {
    const start = new Date(inv.deal.startDate);
    const maturity = new Date(inv.deal.maturityDate);
    if (inv.deal.distribution === 'quarterly') {
      const quarterly = (inv.amount * (inv.deal.targetIRR / 100)) / 4;
      for (const d of quarterlyDates(start, maturity)) {
        if (d >= now && d <= horizon) {
          upcoming.push({ date: d, dealName: inv.deal.name, amount: quarterly, kind: 'quarterly' });
        }
      }
    } else {
      if (maturity >= now && maturity <= horizon) {
        const principalPlusReturn =
          inv.amount + inv.amount * (inv.deal.targetIRR / 100) * (inv.deal.maturityMonths / 12);
        upcoming.push({
          date: maturity,
          dealName: inv.deal.name,
          amount: principalPlusReturn,
          kind: 'maturity',
        });
      }
    }
  }
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="bg-card border border-border-light rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-brand-dark">Upcoming distributions</h3>
        <span className="text-[11px] text-text-tertiary">Next {DAYS_HORIZON} days</span>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No distributions expected in the next {DAYS_HORIZON} days.
        </p>
      ) : (
        <ul className="divide-y divide-border-light">
          {upcoming.slice(0, 5).map((d, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-text-primary">{d.dealName}</div>
                <div className="text-[11px] text-text-secondary">
                  {d.date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {d.kind === 'quarterly' ? 'Quarterly coupon' : 'Maturity'}
                </div>
              </div>
              <span className="tabular-nums font-medium text-text-success">
                {formatEuro(d.amount, { decimals: true })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
