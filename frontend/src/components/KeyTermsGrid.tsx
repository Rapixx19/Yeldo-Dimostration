import type { Deal } from '../types/deal';
import { distributionLabel, formatCompactEuro, formatPercent } from '../lib/format';

function Term({ label, value, footer }: { label: string; value: string; footer?: string }) {
  return (
    <div className="bg-soft rounded-md p-4">
      <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1.5">
        {label}
      </div>
      <div className="text-base font-medium text-text-primary">{value}</div>
      {footer && <div className="text-[11px] text-text-tertiary mt-1">{footer}</div>}
    </div>
  );
}

export function KeyTermsGrid({ deal }: { deal: Deal }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-medium text-brand-dark mb-3">Key terms</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Term label="Target raise" value={formatCompactEuro(deal.targetRaise)} />
        <Term label="Target IRR" value={formatPercent(deal.targetIRR)} />
        <Term label="Maturity" value={`${deal.maturityMonths} months`} />
        <Term label="Loan-to-value" value={formatPercent(deal.loanToValue, 0)} />
        <Term label="Distribution" value={distributionLabel(deal.distribution)} />
        <Term label="Minimum ticket" value={formatCompactEuro(deal.minimumTicket)} />
        <Term label="Currency" value="EUR" />
        <Term
          label="Collateral"
          value={deal.hasFirstLienMortgage ? 'First-lien mortgage' : 'Subordinated'}
        />
      </div>
    </section>
  );
}
