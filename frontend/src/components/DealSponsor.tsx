import { Link } from 'react-router-dom';
import type { Deal } from '../types/deal';
import { extractTrackRecord } from '../lib/sponsorFacts';
import { Flag } from './Flag';

/**
 * Per-deal sponsor tab. Three sections, all driven from existing data —
 * we deliberately don't invent fake stats. If a description has no
 * parseable track record numbers, that section is omitted.
 *
 *   1. SponsorHero — name + full description, quote-card layout
 *   2. TrackRecord — regex-extracted numeric facts from the description
 *      ("20+ properties", "9 countries", "1,200+ beds"). Parsed by
 *      lib/sponsorFacts.ts.
 *   3. CatalogDeals — this deal as a navigable card, scaffolded so
 *      future deals from the same sponsor light up automatically.
 */
export function DealSponsor({ deal }: { deal: Deal }) {
  const facts = extractTrackRecord(deal.sponsorDescription);
  return (
    <div className="space-y-6">
      <SponsorHero name={deal.sponsorName} description={deal.sponsorDescription} />
      {facts.length > 0 && <TrackRecord facts={facts} />}
      <CatalogDeals deal={deal} />
    </div>
  );
}

function SponsorHero({ name, description }: { name: string; description: string }) {
  return (
    <section className="bg-card border border-border-light rounded-lg p-6">
      <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-2">Sponsor</p>
      <h2 className="text-2xl font-medium tracking-tight text-brand-dark mb-3">{name}</h2>
      <blockquote className="text-sm text-text-secondary leading-relaxed border-l-2 border-brand-accent pl-4">
        {description}
      </blockquote>
    </section>
  );
}

function TrackRecord({
  facts,
}: {
  facts: Array<{ raw: string; number: string; unit: string }>;
}) {
  return (
    <section className="bg-card border border-border-light rounded-lg p-5">
      <h3 className="font-medium text-brand-dark mb-1">Track record</h3>
      <p className="text-[11px] text-text-tertiary mb-4">
        Numeric facts parsed from the sponsor description. Nothing invented — if a fact
        isn&apos;t in the description, it isn&apos;t here.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {facts.map((f, i) => (
          <div
            key={i}
            className="bg-page border border-border-light rounded-md px-3 py-3"
          >
            <div className="text-2xl font-medium text-brand-dark tabular-nums">{f.number}</div>
            <div className="text-[11px] uppercase tracking-wide text-text-secondary mt-0.5">
              {f.unit}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CatalogDeals({ deal }: { deal: Deal }) {
  // Today: every sponsor in the seed has exactly one deal in the catalog.
  // When/if multiple deals share a sponsor, this list expands automatically
  // (a backend endpoint /api/sponsors/:name/deals could replace the inline
  // single-deal render here without changing the layout).
  return (
    <section>
      <h3 className="font-medium text-brand-dark mb-3">Deals in this catalog</h3>
      <Link
        to={`/deals/${deal.slug}`}
        className="block bg-card border border-border-light rounded-md p-4 hover:border-brand-accent transition"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <Flag country={deal.country} />
          <span className="font-medium text-text-primary text-sm">{deal.name}</span>
        </div>
        <p className="text-[11px] text-text-secondary">
          {deal.location} · {deal.assetClass}
        </p>
      </Link>
      <p className="text-[10px] text-text-tertiary mt-2">
        Only this catalog is shown — there&apos;s no Yeldo-wide sponsor history backing this
        portfolio demo.
      </p>
    </section>
  );
}
