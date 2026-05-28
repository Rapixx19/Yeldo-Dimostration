import type { CashflowEvent } from '../lib/dealFinancials';
import { formatEuro } from '../lib/format';

const KIND_LABELS: Record<CashflowEvent['kind'], string> = {
  invest: 'Initial investment',
  coupon: 'Quarterly coupon',
  maturity: 'Maturity payout',
};

/**
 * Tabular view of every cashflow event in a deal lifecycle.
 * Each row shows date, type, amount, and running cumulative.
 *
 * The "running" column is what makes this useful vs a simple list: at
 * a glance you can see when the investment "breaks even" (cumulative
 * flips back above zero — usually at the maturity row).
 */
export function DistributionSchedule({ events }: { events: CashflowEvent[] }) {
  let running = 0;
  return (
    <div className="bg-card border border-border-light rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border-light">
        <h3 className="font-medium text-brand-dark">Distribution schedule</h3>
        <p className="text-[11px] text-text-tertiary mt-0.5">
          Every scheduled cashflow, in order. Cumulative tracks your running balance — it
          flips back to positive at the maturity payout.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary text-[11px] uppercase tracking-wide">
              <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">
                Date
              </th>
              <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">
                Type
              </th>
              <th className="text-right px-5 py-2.5 font-normal border-b border-border-light">
                Amount
              </th>
              <th className="text-right px-5 py-2.5 font-normal border-b border-border-light">
                Cumulative
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => {
              running += event.amount;
              return (
                <tr
                  key={i}
                  className="border-b border-border-light last:border-b-0 hover:bg-soft/40 transition"
                >
                  <td className="px-5 py-3 text-text-secondary tabular-nums">
                    {event.date.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3 text-text-primary">{KIND_LABELS[event.kind]}</td>
                  <td
                    className={`px-5 py-3 text-right tabular-nums font-medium ${
                      event.amount < 0 ? 'text-text-danger' : 'text-text-success'
                    }`}
                  >
                    {event.amount < 0 ? '−' : '+'}
                    {formatEuro(Math.abs(event.amount), { decimals: true })}
                  </td>
                  <td
                    className={`px-5 py-3 text-right tabular-nums ${
                      running < 0 ? 'text-text-secondary' : 'text-text-primary font-medium'
                    }`}
                  >
                    {running < 0 ? '−' : ''}
                    {formatEuro(Math.abs(running), { decimals: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
