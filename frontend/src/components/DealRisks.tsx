import type { Deal, Risk, SentimentSignal } from '../types/deal';

const SEVERITY_LABEL: Record<Risk['severity'], string> = {
  low: 'Low',
  med: 'Medium',
  high: 'High',
};

const SEVERITY_DOT: Record<Risk['severity'], string> = {
  low: 'bg-text-success',
  med: 'bg-text-warning',
  high: 'bg-text-danger',
};

const SEVERITY_CARD_BORDER: Record<Risk['severity'], string> = {
  low: 'border-text-success/20',
  med: 'border-text-warning/30',
  high: 'border-text-danger/40',
};

/**
 * Per-deal risks tab. Three sections, each adding value beyond what
 * the Overview tab shows:
 *
 *   1. Severity summary — count of low/med/high risks at a glance
 *   2. Curated risks — same data as Overview's RiskProfile but in
 *      card format with more breathing room and severity-tinted borders
 *   3. Auto-detected signals — sentimentSignals reframed by polarity:
 *      negative ones become risk factors, positives become mitigations.
 *      The signals already exist (computed by sentiment.ts) but viewing
 *      them split by polarity makes the risk lens explicit.
 */
export function DealRisks({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-6">
      <SeveritySummary risks={deal.risks} />
      <CuratedRisks risks={deal.risks} />
      <SignalsSection signals={deal.sentimentSignals} />
    </div>
  );
}

function SeveritySummary({ risks }: { risks: Risk[] }) {
  const counts = { low: 0, med: 0, high: 0 } as Record<Risk['severity'], number>;
  for (const r of risks) counts[r.severity] += 1;

  return (
    <section className="bg-card border border-border-light rounded-lg p-5">
      <h2 className="text-base font-medium text-brand-dark mb-1">Severity summary</h2>
      <p className="text-[11px] text-text-tertiary mb-4">
        Across {risks.length} curated risk factor{risks.length === 1 ? '' : 's'}.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {(['low', 'med', 'high'] as const).map((sev) => (
          <div key={sev} className="bg-page border border-border-light rounded-md p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[sev]}`} />
              <span className="text-[11px] uppercase tracking-wide text-text-secondary">
                {SEVERITY_LABEL[sev]}
              </span>
            </div>
            <div className="text-2xl font-medium text-brand-dark tabular-nums">{counts[sev]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CuratedRisks({ risks }: { risks: Risk[] }) {
  if (!risks?.length) return null;
  return (
    <section>
      <h2 className="text-base font-medium text-brand-dark mb-3">Curated risk factors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {risks.map((r, i) => (
          <article
            key={i}
            className={`bg-card border-l-2 border-border-light rounded-md p-4 ${SEVERITY_CARD_BORDER[r.severity]}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-text-primary text-sm">{r.category}</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[r.severity]}`} />
                {SEVERITY_LABEL[r.severity]}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{r.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SignalsSection({ signals }: { signals: SentimentSignal[] }) {
  const positive = signals.filter((s) => s.polarity === 'positive');
  const negative = signals.filter((s) => s.polarity === 'negative');

  if (positive.length === 0 && negative.length === 0) return null;

  return (
    <section className="bg-card border border-border-light rounded-lg p-5">
      <h2 className="text-base font-medium text-brand-dark mb-1">Auto-detected signals</h2>
      <p className="text-[11px] text-text-tertiary mb-4">
        FinBERT-style signal extraction from the deal&apos;s KPIs. Reframed here as risks
        (negative polarity) and mitigations (positive polarity).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SignalColumn
          title="Mitigating factors"
          accent="text-text-success"
          dot="bg-text-success"
          items={positive.map((s) => s.text)}
          emptyText="No positive signals detected"
        />
        <SignalColumn
          title="Risk factors"
          accent="text-text-warning"
          dot="bg-text-warning"
          items={negative.map((s) => s.text)}
          emptyText="No negative signals detected"
        />
      </div>
    </section>
  );
}

function SignalColumn({
  title,
  accent,
  dot,
  items,
  emptyText,
}: {
  title: string;
  accent: string;
  dot: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div>
      <div className={`text-[11px] uppercase tracking-wide mb-2 ${accent}`}>{title}</div>
      {items.length === 0 ? (
        <p className="text-xs text-text-tertiary italic">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((text, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-snug">
              <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-1.5 shrink-0`} />
              <span className="text-text-primary">{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
