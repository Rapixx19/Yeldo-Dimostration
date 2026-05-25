const STATS = [
  { label: 'Total transacted', value: '€220M+' },
  { label: 'Financed deals', value: '74' },
  { label: 'Historical IRR', value: '11.8%' },
  { label: 'Exited deals', value: '38' },
];

export function StatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {STATS.map((s) => (
        <div key={s.label} className="bg-soft rounded-md p-4">
          <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1.5">
            {s.label}
          </div>
          <div className="text-xl font-medium tracking-tight text-brand-dark">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
