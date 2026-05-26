import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchActivityById } from '../api/activity';
import type { ActivityItem } from '../types/activity';

/**
 * Subscribes to INSERTs on public.investments via Supabase Realtime.
 * Returns the live-merged list (snapshot + new inserts, deduped, capped).
 *
 * Connection state is exposed so the UI can show a "LIVE" indicator.
 *
 * NOTE: Realtime must be enabled on public.investments in the Supabase
 * dashboard (Database → Replication) for events to fire.
 */
export function useInvestmentLiveFeed(snapshot: ActivityItem[], max = 5) {
  const [items, setItems] = useState<ActivityItem[]>(snapshot);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setItems(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const channel = supabase
      .channel('investments-live-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'investments' },
        async (payload) => {
          const id = (payload.new as { id?: string }).id;
          if (!id) return;
          try {
            const item = await fetchActivityById(id);
            setItems((prev) => [item, ...prev.filter((p) => p.id !== item.id)].slice(0, max));
          } catch {
            // Server may briefly 404 for newly-created rows; skip silently.
          }
        },
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [max]);

  return { items, connected };
}
