import type { Deal } from '../types/deal';

export function SponsorCard({ deal }: { deal: Deal }) {
  return (
    <section className="bg-card border border-border-light rounded-lg p-5 mb-6">
      <h2 className="text-base font-medium text-brand-dark mb-1">Sponsor</h2>
      <p className="font-medium text-text-primary">{deal.sponsorName}</p>
      <p className="text-sm text-text-secondary leading-relaxed mt-2">
        {deal.sponsorDescription}
      </p>
    </section>
  );
}
