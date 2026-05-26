import { Link } from 'react-router-dom';
import type { Investment } from '../types/deal';
import { Flag } from './Flag';
import { MaturityProgressBar } from './MaturityProgressBar';
import { SentimentChip } from './SentimentChip';
import { formatEuro, formatPercent, instrumentLabel } from '../lib/format';
import { weightedMaturity } from '../lib/portfolioStats';

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

export function InvestmentsTable({ investments }: { investments: Investment[] }) {
  return (
    <div className="bg-card border border-border-light rounded-lg overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <h3 className="font-medium text-brand-dark">Active investments</h3>
        <span className="text-[11px] text-text-tertiary">
          {investments.length} deals · weighted maturity {weightedMaturity(investments)} months
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary text-[11px] uppercase tracking-wide">
              <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">Deal</th>
              <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">
                Instrument
              </th>
              <th className="text-right px-5 py-2.5 font-normal border-b border-border-light">
                Invested
              </th>
              <th className="text-right px-5 py-2.5 font-normal border-b border-border-light">
                IRR
              </th>
              <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">
                Sentiment
              </th>
              <th className="text-left px-5 py-2.5 font-normal border-b border-border-light">
                Maturity
              </th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-border-light last:border-b-0 hover:bg-soft/40 transition"
              >
                <td className="px-5 py-3.5">
                  <Link
                    to={`/deals/${inv.deal.slug}`}
                    className="flex items-center gap-2.5 text-text-primary hover:text-brand-dark"
                  >
                    <Flag country={inv.deal.country} />
                    <span className="font-medium">{inv.deal.name}</span>
                  </Link>
                  <div className="text-[11px] text-text-secondary mt-0.5 ml-7 max-w-md">
                    {truncate(inv.deal.sponsorDescription, 80)}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-soft text-text-primary">
                    {instrumentLabel(inv.deal.instrument)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-text-primary">
                  {formatEuro(inv.amount)}
                </td>
                <td className="px-5 py-3.5 text-right tabular-nums text-text-success font-medium">
                  {formatPercent(inv.deal.targetIRR)}
                </td>
                <td className="px-5 py-3.5">
                  <SentimentChip
                    label={inv.deal.sentimentLabel}
                    score={inv.deal.sentimentScore}
                  />
                </td>
                <td className="px-5 py-3.5">
                  <MaturityProgressBar
                    startDate={inv.deal.startDate}
                    maturityMonths={inv.deal.maturityMonths}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
