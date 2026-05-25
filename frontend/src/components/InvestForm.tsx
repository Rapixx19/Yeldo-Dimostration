import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';
import type { Deal } from '../types/deal';
import { useAuth } from '../contexts/AuthContext';
import { createInvestment } from '../api/investments';
import {
  distributionLabel,
  formatEuro,
  formatPercent,
} from '../lib/format';

const QUICK_AMOUNTS = [100_000, 250_000, 500_000];

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${emphasize ? 'font-medium text-text-primary border-t border-border-light pt-2 mt-2' : 'text-text-secondary'}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-0.5">
        {label}
      </div>
      <div className={`font-medium ${valueClass ?? 'text-text-primary'}`}>{value}</div>
    </div>
  );
}

export function InvestForm({ deal }: { deal: Deal }) {
  const { token } = useAuth();
  const nav = useNavigate();
  const [amount, setAmount] = useState<number>(deal.minimumTicket);
  const [submitting, setSubmitting] = useState(false);

  const remaining = Math.max(0, deal.targetRaise - deal.raisedAmount);
  const raisePct = Math.min(100, (deal.raisedAmount / deal.targetRaise) * 100);
  const expectedReturn = amount * (deal.targetIRR / 100) * (deal.maturityMonths / 12);
  const quarterlyDist = (amount * (deal.targetIRR / 100)) / 4;

  async function handleInvest() {
    if (!token) {
      toast.error('Please sign in to invest');
      nav('/auth/login');
      return;
    }
    if (amount < deal.minimumTicket) {
      toast.error(`Minimum ticket is ${formatEuro(deal.minimumTicket)}`);
      return;
    }
    if (amount > remaining) {
      toast.error(`Only ${formatEuro(remaining)} remaining`);
      return;
    }
    setSubmitting(true);
    try {
      await createInvestment(deal.id, amount);
      toast.success('Investment confirmed');
      nav('/portfolio');
    } catch (e) {
      const msg = isAxiosError(e)
        ? ((e.response?.data as { error?: string } | undefined)?.error ?? 'Investment failed')
        : 'Investment failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card border border-border-light rounded-lg p-5 sticky top-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-text-success font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-text-success" />
          {deal.status === 'open' ? 'OPEN' : deal.status.toUpperCase()} ·{' '}
          {Math.round(raisePct)}% raised
        </span>
        <span className="text-[11px] text-text-secondary">Min {formatEuro(deal.minimumTicket)}</span>
      </div>

      <div className="text-2xl font-medium tracking-tight text-text-primary">
        {formatEuro(deal.raisedAmount)}
      </div>
      <div className="text-xs text-text-secondary mb-3">
        raised of {formatEuro(deal.targetRaise)} target
      </div>

      <div className="w-full h-1.5 bg-soft rounded-full overflow-hidden mb-5">
        <div className="h-full bg-brand-accent" style={{ width: `${raisePct}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3 pb-5 mb-5 border-b border-border-light text-xs">
        <Stat label="Target IRR" value={formatPercent(deal.targetIRR)} valueClass="text-text-success" />
        <Stat label="Maturity" value={`${deal.maturityMonths} months`} />
        <Stat label="LTV" value={formatPercent(deal.loanToValue, 0)} />
        <Stat label="Distribution" value={distributionLabel(deal.distribution)} />
      </div>

      <label htmlFor="invest-amount" className="block text-xs text-text-secondary mb-1.5">
        Investment amount (€)
      </label>
      <input
        id="invest-amount"
        type="number"
        min={0}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value) || 0)}
        className="w-full px-3 py-3 border border-border-light rounded-md text-lg font-medium bg-card mb-2 tabular-nums"
      />
      <div className="flex gap-1.5 mb-3">
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(a)}
            className="flex-1 py-1.5 text-[11px] border border-border-light rounded-md hover:bg-soft"
          >
            €{a / 1000}K
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmount(remaining)}
          className="flex-1 py-1.5 text-[11px] border border-border-light rounded-md hover:bg-soft"
        >
          Max
        </button>
      </div>

      <div className="bg-soft rounded-md p-3 mb-3 text-xs space-y-1 tabular-nums">
        <Row label="Investment" value={formatEuro(amount, { decimals: true })} />
        <Row
          label="Expected returns (IRR)"
          value={formatEuro(expectedReturn, { decimals: true })}
        />
        {deal.distribution === 'quarterly' && (
          <Row
            label="Quarterly distribution"
            value={formatEuro(quarterlyDist, { decimals: true })}
          />
        )}
        <Row
          label="Total projected"
          value={formatEuro(amount + expectedReturn, { decimals: true })}
          emphasize
        />
      </div>

      <button
        onClick={handleInvest}
        disabled={submitting || deal.status !== 'open'}
        className="w-full py-3 bg-brand-dark text-page rounded-md text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Processing…' : deal.status === 'open' ? 'Invest now' : 'Closed to new capital'}
      </button>
      <p className="text-[11px] text-text-tertiary text-center mt-2 leading-relaxed">
        Virtual portfolio simulation. Reserved to professional investors as defined under FinSA
        Art. 4-5.
      </p>
    </div>
  );
}
