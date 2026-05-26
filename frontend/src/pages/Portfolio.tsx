import { Link } from 'react-router-dom';
import { useInvestments } from '../hooks/useInvestments';
import { usePortfolio } from '../hooks/usePortfolio';
import { CompositionMetrics } from '../components/CompositionMetrics';
import { UpcomingDistributions } from '../components/UpcomingDistributions';
import { InvestmentsTable } from '../components/InvestmentsTable';
import { formatEuro } from '../lib/format';

export function Portfolio() {
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
        <h1 className="text-2xl font-medium tracking-tight text-brand-dark">Your investments</h1>
        <p className="text-text-secondary text-sm">
          {investments.length} active across {kpis.activeDealsCount} deals · total{' '}
          {formatEuro(kpis.totalInvested)}
        </p>
      </header>

      <CompositionMetrics investments={investments} />
      <UpcomingDistributions investments={investments} />
      <InvestmentsTable investments={investments} />
    </div>
  );
}
