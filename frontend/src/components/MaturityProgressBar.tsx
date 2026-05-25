function monthsBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

export function MaturityProgressBar({
  startDate,
  maturityMonths,
}: {
  startDate: string;
  maturityMonths: number;
}) {
  const start = new Date(startDate);
  const now = new Date();
  const elapsed = Math.max(0, monthsBetween(start, now));
  const pct = Math.max(0, Math.min(100, (elapsed / maturityMonths) * 100));
  const remaining = Math.max(0, Math.round(maturityMonths - elapsed));

  return (
    <div className="min-w-[140px]">
      <div className="w-full h-1 bg-soft rounded-full overflow-hidden mb-1">
        <div className="h-full bg-brand-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-text-secondary tabular-nums">
        {remaining} mo remaining
      </div>
    </div>
  );
}
