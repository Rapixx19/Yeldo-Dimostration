import { Link } from 'react-router-dom';
import { useInvestments } from '../hooks/useInvestments';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAuth } from '../contexts/AuthContext';
import { KPICard } from '../components/KPICard';
import { CountryAllocation } from '../components/CountryAllocation';
import { AssetClassAllocation } from '../components/AssetClassAllocation';
import { ConcentrationMetrics } from '../components/ConcentrationMetrics';
import { ForecastChart } from '../components/ForecastChart';
import { ActivityFeed } from '../components/ActivityFeed';
import { formatEuro, formatPercent } from '../lib/format';

export function Dashboard() {
  const { user } = useAuth();
  const { data: investments, isLoading: invLoading } = useInvestments();
  const { data: kpis, isLoading: kpiLoading } = usePortfolio();

  if (invLoading || kpiLoading) {
    return <div className="py-16 text-center text-text-secondary">Loading dashboard…</div>;
  }

  if (!kpis || investments.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-medium tracking-tight mb-2 text-brand-dark">
          Nothing to show yet
        </h1>
        <p className="text-text-secondary mb-6">
          Make a virtual investment to populate your dashboard.
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
        <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-2">Dashboard</p>
        <h1 className="text-2xl font-medium tracking-tight text-brand-dark">
          {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Live overview'}
        </h1>
        <p className="text-text-secondary text-sm">
          Total portfolio value:{' '}
          {formatEuro(kpis.totalInvested + kpis.projectedReturns, { decimals: true })}
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

      <ForecastChart investments={investments} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 mb-6">
        <CountryAllocation allocation={kpis.countryAllocation} />
        <AssetClassAllocation investments={investments} />
        <ActivityFeed />
      </div>

      <ConcentrationMetrics investments={investments} />
    </div>
  );
}
