import type { DealEvent } from '../types/deal';

const EVENT_TYPE_META: Record<
  string,
  { label: string; dot: string; chip: string }
> = {
  launch: {
    label: 'Launch',
    dot: 'bg-brand-accent',
    chip: 'bg-brand-accent/15 text-brand-accent',
  },
  milestone: {
    label: 'Milestone',
    dot: 'bg-text-success',
    chip: 'bg-text-success/15 text-text-success',
  },
  news: {
    label: 'News',
    dot: 'bg-text-warning',
    chip: 'bg-text-warning/15 text-text-warning',
  },
  status_change: {
    label: 'Status change',
    dot: 'bg-text-secondary',
    chip: 'bg-soft text-text-secondary',
  },
};

const DEFAULT_META = {
  label: 'Update',
  dot: 'bg-text-secondary',
  chip: 'bg-soft text-text-secondary',
};

/**
 * Per-deal updates timeline. Renders events in reverse chronological order
 * (newest first) as a vertical timeline with colored event-type chips.
 *
 * Events come from the deal payload (the backend includes them in
 * GET /api/deals/:slug). If the events array is empty or missing,
 * an empty-state card is shown — never a crash.
 */
export function DealUpdates({ events }: { events: DealEvent[] | undefined }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-card border border-border-light rounded-lg p-8 text-center text-sm text-text-secondary">
        No updates yet for this deal.
      </div>
    );
  }

  return (
    <section className="bg-card border border-border-light rounded-lg p-5">
      <h2 className="text-base font-medium text-brand-dark mb-1">Deal updates</h2>
      <p className="text-[11px] text-text-tertiary mb-5">
        Lifecycle events in reverse chronological order — most recent first.
      </p>
      <ol className="space-y-5 relative">
        {/* the vertical timeline rail behind the dots */}
        <span
          className="absolute left-[5px] top-1 bottom-1 w-px bg-border-light"
          aria-hidden
        />
        {events.map((event) => {
          const meta = EVENT_TYPE_META[event.eventType] ?? DEFAULT_META;
          return (
            <li key={event.id} className="relative pl-6">
              <span
                className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full ring-2 ring-card ${meta.dot}`}
                aria-hidden
              />
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded ${meta.chip}`}
                >
                  {meta.label}
                </span>
                <time
                  className="text-[11px] text-text-tertiary tabular-nums"
                  dateTime={event.createdAt}
                >
                  {new Date(event.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <p className="text-sm text-text-primary leading-snug">{event.message}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
