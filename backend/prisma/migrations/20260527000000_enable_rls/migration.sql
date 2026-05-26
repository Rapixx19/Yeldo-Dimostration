-- Enable Row-Level Security on the two public tables that today are exposed
-- read/write to anyone with the anon key.
--
-- Context
-- -------
-- Express (running with the service_role key) bypasses RLS for all writes,
-- so application behavior is unchanged. The change targets direct browser
-- access via Supabase REST + Realtime, which today would let a visitor
-- holding the anon key (pulled out of the JS bundle) POST malicious rows
-- to investments or modify deals.
--
-- Policy design
-- -------------
-- DEALS:
--   * SELECT is open to everyone. Deals are public; Discover renders them
--     even for unauthenticated visitors.
--   * INSERT / UPDATE / DELETE: no policy declared → blocked for anon and
--     authenticated. Backend writes via service_role, which bypasses RLS.
--
-- INVESTMENTS:
--   * SELECT is open to everyone. This is the pragmatic choice for the
--     demo so Supabase Realtime broadcasts INSERTs to the ActivityFeed
--     component (which subscribes from the browser). Realtime applies RLS
--     to broadcasts, so a stricter "own row only" policy would break the
--     global activity feed.
--   * INSERT / UPDATE / DELETE: no policy → blocked for anon and
--     authenticated. Backend writes via service_role.
--
-- The leaked field by allowing SELECT is the userId UUID, which is not PII
-- on its own — names/emails live in auth.users which Supabase already
-- gates against the anon role. The Express /api/activity/recent endpoint
-- further anonymizes the response (first name only).
--
-- Future hardening (out of scope for this migration)
-- -----------------------------------------------
-- A production-grade fix would replace the browser Realtime subscription
-- on `investments` with a dedicated `activity_log` table that holds only
-- the columns safe to broadcast (amount, dealId, displayName, ts).
-- A Postgres trigger on investments populates activity_log, the strict
-- RLS policy stays on investments, and the browser subscribes to
-- activity_log instead. Logged for a future PR.

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY deals_select_all ON public.deals
  FOR SELECT
  USING (true);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY investments_select_all ON public.investments
  FOR SELECT
  USING (true);
