import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useDeal } from '../hooks/useDeal';
import { DealHero } from '../components/DealHero';
import { DealTabs, type DealTab } from '../components/DealTabs';
import { DealFinancials } from '../components/DealFinancials';
import { KeyTermsGrid } from '../components/KeyTermsGrid';
import { SponsorCard } from '../components/SponsorCard';
import { RiskProfile } from '../components/RiskProfile';
import { SentimentWidget } from '../components/SentimentWidget';
import { InvestForm } from '../components/InvestForm';

export function DealDetailPage() {
  const { slug } = useParams();
  const { data: deal, isLoading, error } = useDeal(slug);
  const [tab, setTab] = useState<DealTab>('overview');

  if (isLoading) {
    return <div className="py-16 text-center text-text-secondary">Loading deal…</div>;
  }
  if (error || !deal) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-danger mb-3">Deal not found.</p>
        <Link to="/discover" className="text-brand-accent hover:underline text-sm">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <nav aria-label="Breadcrumb" className="text-xs text-text-tertiary mb-3">
        <Link to="/discover" className="hover:text-text-primary">
          Discover
        </Link>
        <span className="mx-2">/</span>
        <span>{deal.name}</span>
      </nav>

      <DealHero deal={deal} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-6">
        <div>
          <DealTabs active={tab} onChange={setTab} />

          {tab === 'overview' && (
            <>
              <section className="bg-card border border-border-light rounded-lg p-5 mb-6">
                <h2 className="text-base font-medium text-brand-dark mb-2">
                  Investment summary
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">{deal.description}</p>
              </section>

              <SentimentWidget deal={deal} />

              <KeyTermsGrid deal={deal} />

              <SponsorCard deal={deal} />

              <RiskProfile risks={deal.risks} />
            </>
          )}

          {tab === 'financials' && <DealFinancials deal={deal} />}

          {tab !== 'overview' && tab !== 'financials' && (
            <div className="bg-card border border-border-light rounded-lg p-8 text-center text-sm text-text-secondary">
              Detailed <strong>{tab}</strong> view coming in a follow-up PR.
            </div>
          )}
        </div>

        <div>
          <InvestForm deal={deal} />
        </div>
      </div>
    </div>
  );
}
