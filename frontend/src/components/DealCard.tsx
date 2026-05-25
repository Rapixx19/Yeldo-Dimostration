import { Link } from 'react-router-dom';
import type { Deal } from '../types/deal';
import { SentimentChip } from './SentimentChip';
import { Flag } from './Flag';
import {
  distributionLabel,
  formatCompactEuro,
  formatPercent,
  instrumentLabel,
} from '../lib/format';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-0.5">
        {label}
      </div>
      <div className="font-medium text-text-primary">{value}</div>
    </div>
  );
}

export function DealCard({ deal }: { deal: Deal }) {
  const raisePct = Math.min(100, (deal.raisedAmount / deal.targetRaise) * 100);

  return (
    <Link
      to={`/deals/${deal.slug}`}
      className="block bg-card border border-border-light rounded-lg overflow-hidden hover:border-brand-accent transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <div className="h-36 relative bg-brand-dark p-3 flex items-end">
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span className="bg-page text-brand-dark px-2 py-0.5 rounded-full text-[10px] font-medium">
            Reserved to Professional Investors
          </span>
          <Flag country={deal.country} />
        </div>
        <span className="bg-page text-brand-dark px-2 py-0.5 rounded text-[11px] font-medium">
          {instrumentLabel(deal.instrument)}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-text-primary">{deal.name}</h3>
          <SentimentChip label={deal.sentimentLabel} score={deal.sentimentScore} />
        </div>
        <p className="text-xs text-text-secondary mb-4">
          {deal.location} · {deal.assetClass}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <Stat label="Maturity" value={`${deal.maturityMonths} months`} />
          <Stat label="Loan-to-value" value={formatPercent(deal.loanToValue, 0)} />
          <Stat label="Distribution" value={distributionLabel(deal.distribution)} />
          <Stat label="Target IRR" value={formatPercent(deal.targetIRR)} />
        </div>

        <div className="w-full h-1 bg-soft rounded-full overflow-hidden mb-2">
          <div className="h-full bg-text-success" style={{ width: `${raisePct}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-text-secondary mb-3">
          <span>Raised</span>
          <span className="font-medium text-text-primary">
            {formatCompactEuro(deal.raisedAmount)} / {formatCompactEuro(deal.targetRaise)}
          </span>
        </div>

        <span className="block w-full text-center py-2 bg-brand-dark text-page rounded-md text-sm font-medium">
          View deal
        </span>
      </div>
    </Link>
  );
}
