import { useEffect, useState } from 'react';
import { useRecentActivity } from '../hooks/useRecentActivity';
import { useInvestmentLiveFeed } from '../hooks/useInvestmentLiveFeed';
import { formatEuro } from '../lib/format';
import { timeAgo } from '../lib/timeAgo';

const ROTATE_MS = 4000;

/**
 * Single-line live activity ticker for the Landing page.
 *
 * Why this lives separately from ActivityFeed (the Dashboard panel)
 * -----------------------------------------------------------------
 * Same data, two presentations:
 *   * ActivityFeed     — full card on the Dashboard, lists 5 events
 *   * ActivityTicker   — one row above the Landing CTAs, rotates
 *
 * Both compose the same hooks (useRecentActivity + useInvestmentLiveFeed)
 * so business logic stays in one place; only the JSX differs.
 *
 * Visual rotation
 * ---------------
 * If the feed has 2+ items, the ticker auto-rotates through them
 * every ROTATE_MS. The interval is reset whenever a new live event
 * arrives, so a fresh investment becomes immediately visible rather
 * than waiting up to 4s for the rotation to land on it.
 *
 * Empty state
 * -----------
 * If neither the initial snapshot nor the live feed has anything yet,
 * the component renders nothing (returns null). No skeleton, no
 * "loading" — the Landing page still works fine without this strip.
 */
export function ActivityTicker() {
  const { data: snapshot } = useRecentActivity(3);
  const { items, connected } = useInvestmentLiveFeed(snapshot, 3);
  const [index, setIndex] = useState(0);

  // Reset to the newest item whenever a live event reorders the list.
  // items[0] is always the most recent.
  useEffect(() => {
    setIndex(0);
  }, [items[0]?.id]);

  // Rotate through the available items.
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  const active = items[index];
  if (!active) return null;

  return (
    <div className="bg-card border border-border-light rounded-md px-4 py-2.5 mb-6 flex items-center gap-3 text-sm">
      <span
        className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-medium ${
          connected ? 'text-text-danger' : 'text-text-secondary'
        }`}
        aria-label={connected ? 'live' : 'connecting'}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            connected ? 'bg-text-danger animate-pulse' : 'bg-text-secondary'
          }`}
        />
        {connected ? 'Live' : '…'}
      </span>
      <span className="text-text-primary truncate">
        <span className="font-medium tabular-nums">{formatEuro(active.amount)}</span>
        <span className="text-text-secondary"> invested in </span>
        <span className="font-medium">{active.dealName}</span>
        <span className="text-text-tertiary"> · {timeAgo(active.investedAt)}</span>
      </span>
    </div>
  );
}
