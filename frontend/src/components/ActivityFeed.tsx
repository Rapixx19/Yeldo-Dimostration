import { useRecentActivity } from '../hooks/useRecentActivity';
import { useInvestmentLiveFeed } from '../hooks/useInvestmentLiveFeed';
import { formatEuro } from '../lib/format';
import { timeAgo } from '../lib/timeAgo';

export function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const { data: snapshot, isLoading } = useRecentActivity(limit);
  const { items, connected } = useInvestmentLiveFeed(snapshot, limit);

  return (
    <div className="bg-card border border-border-light rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-xs font-medium ${
            connected ? 'text-text-danger' : 'text-text-secondary'
          }`}
        >
          {connected ? '🔴 LIVE' : '○ connecting…'}
        </span>
        <h3 className="font-medium text-brand-dark">Recent activity</h3>
      </div>

      {isLoading ? (
        <p className="text-text-secondary text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-text-secondary text-sm">
          No activity yet. Make an investment to see it here.
        </p>
      ) : (
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.id} className="border-b border-border-light pb-3 last:border-0">
              <div className="font-medium text-brand-dark">
                {formatEuro(item.amount)} → {item.dealName}
              </div>
              <div className="text-xs text-text-secondary">
                {item.userName} · {timeAgo(item.investedAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
