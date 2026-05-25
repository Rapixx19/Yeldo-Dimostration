import type { Risk } from '../types/deal';

const SEVERITY_DOT: Record<Risk['severity'], string> = {
  low: 'bg-text-success',
  med: 'bg-text-warning',
  high: 'bg-text-danger',
};

const SEVERITY_LABEL: Record<Risk['severity'], string> = {
  low: 'Low',
  med: 'Medium',
  high: 'High',
};

export function RiskProfile({ risks }: { risks: Risk[] }) {
  if (!risks?.length) return null;
  return (
    <section className="bg-card border border-border-light rounded-lg p-5 mb-6">
      <h2 className="text-base font-medium text-brand-dark mb-3">Risk profile</h2>
      <ul className="space-y-2.5">
        {risks.map((r, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[r.severity]}`} />
            <span className="font-medium text-text-primary min-w-[140px]">{r.category}</span>
            <span className="text-text-secondary">{r.note}</span>
            <span className="ml-auto text-[11px] uppercase tracking-wide text-text-tertiary">
              {SEVERITY_LABEL[r.severity]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
