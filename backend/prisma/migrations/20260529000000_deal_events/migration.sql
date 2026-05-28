-- Per-deal event timeline (V2 Tab 5).
--
-- Stores small messages tied to a deal's lifecycle so the Updates
-- tab on the deal detail page can render a vertical timeline.
--
-- eventType is a free-form string rather than a Postgres enum because:
--   * we want to add new event types without a migration
--   * the frontend has a known set it gives icons to; everything else
--     falls through to a default icon
--
-- The dealId index is the only access pattern (always filtered by deal).
-- ON DELETE CASCADE so removing a deal cleans up its event history.

CREATE TABLE IF NOT EXISTS public.deal_events (
  id          TEXT PRIMARY KEY,
  "dealId"    TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  message     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT deal_events_deal_fk
    FOREIGN KEY ("dealId") REFERENCES public.deals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS deal_events_dealId_idx
  ON public.deal_events ("dealId");
