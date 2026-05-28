import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Live progress state for one deal — exposed to consumers.
 */
export interface DealLiveState {
  /** The most recent raisedAmount seen from Realtime, or the initial value. */
  raisedAmount: number;
  /** True for ~2s after a fresh update so the UI can pulse a "LIVE" badge. */
  pulsing: boolean;
}

const PULSE_MS = 2000;

/**
 * Subscribes to Supabase Realtime UPDATE events on public.deals for the
 * caller's set of visible deal IDs. Returns a map keyed by dealId of
 * { raisedAmount, pulsing }.
 *
 * Consumer pattern
 * ----------------
 *   const live = useDealsLive(deals.map(d => d.id), initialMap);
 *   const raised = live[deal.id]?.raisedAmount ?? deal.raisedAmount;
 *   const pulsing = !!live[deal.id]?.pulsing;
 *
 * Channel strategy
 * ----------------
 * One channel per `dealIds.join('|')` signature. When the visible set
 * changes (e.g. filters change on Discover), the previous channel is
 * removed and a fresh one subscribed. This keeps Postgres broadcast
 * volume in proportion to what's actually on screen.
 *
 * Realtime preconditions (set in the DB, not here)
 * ------------------------------------------------
 *   ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
 * Without that, this hook subscribes silently but never receives events.
 */
export function useDealsLive(
  dealIds: string[],
  initial: Record<string, number>,
): Record<string, DealLiveState> {
  const [state, setState] = useState<Record<string, DealLiveState>>(() => {
    const seed: Record<string, DealLiveState> = {};
    for (const id of dealIds) {
      seed[id] = { raisedAmount: initial[id] ?? 0, pulsing: false };
    }
    return seed;
  });

  // Track pulse timers so a rapid second update extends the pulse window
  // rather than firing two overlapping setTimeouts.
  const pulseTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Re-key the state when the consumer's dealIds set changes (e.g. user
  // applies a country filter on Discover and the visible deals shift).
  const idsKey = dealIds.join('|');
  useEffect(() => {
    setState((prev) => {
      const next: Record<string, DealLiveState> = {};
      for (const id of dealIds) {
        next[id] = prev[id] ?? { raisedAmount: initial[id] ?? 0, pulsing: false };
      }
      return next;
    });
    // We intentionally re-run on idsKey only — `initial` is only used to
    // seed missing entries, not to overwrite live state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    if (dealIds.length === 0) return;

    // Supabase Realtime's filter syntax supports `in.(a,b,c)` for an
    // IN-style match on a column. We use it to scope the channel to
    // only the currently-visible deals.
    const filter = `id=in.(${dealIds.join(',')})`;

    const channel = supabase
      .channel(`deals-live-${idsKey}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals', filter },
        (payload) => {
          const newRow = payload.new as { id?: string; raisedAmount?: number };
          if (!newRow.id || typeof newRow.raisedAmount !== 'number') return;
          const id = newRow.id;
          const amount = newRow.raisedAmount;

          setState((prev) => ({
            ...prev,
            [id]: { raisedAmount: amount, pulsing: true },
          }));

          // Stop pulsing after PULSE_MS. Extend the window if a new update
          // arrives mid-pulse (clears the existing timer).
          const existing = pulseTimers.current[id];
          if (existing) clearTimeout(existing);
          pulseTimers.current[id] = setTimeout(() => {
            setState((prev) =>
              prev[id] ? { ...prev, [id]: { ...prev[id], pulsing: false } } : prev,
            );
            delete pulseTimers.current[id];
          }, PULSE_MS);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      for (const timer of Object.values(pulseTimers.current)) clearTimeout(timer);
      pulseTimers.current = {};
    };
  }, [idsKey]);

  return state;
}
