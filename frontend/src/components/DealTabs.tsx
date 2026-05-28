export type DealTab = 'overview' | 'financials' | 'sponsor' | 'risks' | 'updates' | 'documents';

const TABS: Array<{ id: DealTab; label: string; comingSoon?: boolean }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Financials' },
  { id: 'sponsor', label: 'Sponsor', comingSoon: true },
  { id: 'risks', label: 'Risks', comingSoon: true },
  { id: 'updates', label: 'Updates', comingSoon: true },
  { id: 'documents', label: 'Documents', comingSoon: true },
];

export function DealTabs({
  active,
  onChange,
}: {
  active: DealTab;
  onChange: (tab: DealTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border-light mb-5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition ${
            active === tab.id
              ? 'border-brand-accent text-brand-dark font-medium'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          {tab.label}
          {tab.comingSoon && (
            <span className="ml-1.5 text-[10px] text-text-tertiary">soon</span>
          )}
        </button>
      ))}
    </div>
  );
}
