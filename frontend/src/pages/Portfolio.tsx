import { Link } from 'react-router-dom';
import { useInvestments } from '../hooks/useInvestments';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/KPICard';
import { AllocationDonut } from '../components/AllocationDonut';
import { UpcomingDistributions } from '../components/UpcomingDistributions';
import { InvestmentsTable } from '../components/InvestmentsTable';
import { formatEuro, formatPercent } from '../lib/format';

export function Portfolio() {
  const { user } = useAuth();
  const { data: investments, isLoading: invLoading } = useInvestments();
  const { data: kpis, isLoading: kpiLoading } = usePortfolio();

  if (invLoading || kpiLoading) {
    return <div className="py-16 text-center text-text-secondary">Loading portfolio…</div>;
  }

  if (!kpis || investments.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-medium tracking-tight mb-2 text-brand-dark">
          Your portfolio is empty
        </h1>
        <p className="text-text-secondary mb-6">
          You haven&apos;t made any virtual investments yet.
        </p>
        <Link
          to="/discover"
          className="inline-block px-6 py-3 bg-brand-dark text-page rounded-md text-sm font-medium hover:opacity-90"
        >
          Browse deals
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-2">Portfolio</p>
        <h1 className="text-2xl font-medium tracking-tight text-brand-dark">
          {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your portfolio'}
        </h1>
        <p className="text-text-secondary text-sm">
          Total portfolio value: {formatEuro(kpis.totalInvested + kpis.projectedReturns, { decimals: true })}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label="Total invested"
          value={formatEuro(kpis.totalInvested)}
          footer={`across ${kpis.activeDealsCount} deals`}
        />
        <KPICard
          label="Weighted IRR"
          value={formatPercent(kpis.weightedIRR)}
          footer="Amount-weighted"
          footerVariant="success"
        />
        <KPICard
          label="Projected returns"
          value={formatEuro(kpis.projectedReturns)}
          footer="Over weighted maturity"
          footerVariant="accent"
        />
        <KPICard
          label="Active deals"
          value={String(kpis.activeDealsCount)}
          footer="Currently live"
        />
      </div>

      <div className="bg-soft border border-border-light rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-medium text-brand-dark">TFT-inspired forecast</h2>
          <span className="text-[11px] text-brand-accent uppercase tracking-wide">
            Coming in spec 13
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Multi-horizon portfolio forecast chart will land in Phase 4 (spec 13). See
          <Link to="/about" className="text-brand-accent hover:underline ml-1">
            ML methodology
          </Link>{' '}
          for the architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border-light rounded-lg p-5">
          <h3 className="font-medium text-brand-dark mb-4">Country allocation</h3>
          <AllocationDonut allocation={kpis.countryAllocation} />
        </div>
        <UpcomingDistributions investments={investments} />
      </div>

      <InvestmentsTable investments={investments} />
    </div>
  );
}
