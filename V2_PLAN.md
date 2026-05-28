# V2 Plan — full roadmap

> Updated 2026-05-26. Phases are sequenced by impact/effort, each feature is
> independently shippable, and every block matches the v1 modular conventions
> documented in `ARCHITECTURE.md`.

## Status today

What has actually landed (in chronological order of merge):

| PR | Phase | Feature | Status |
|----|-------|---------|--------|
| #8 | A1 | Supabase Auth migration (custom bcrypt+JWT → Supabase) | ✅ shipped |
| #9 | A1 | Switch demo account to personal Gmail (less branded as "Yeldo") | ✅ shipped |
| #10 | A1 | Bump backend Node to >=22 (Supabase realtime-js needs WebSocket) | ✅ shipped |
| #11 | A1 | JWKS verification on backend (ES256 access tokens, HS256 fallback) | ✅ shipped |
| #12 | A2-partial | Dashboard as Live Overview + ActivityFeed (Realtime feed on /dashboard) | ✅ shipped |
| #13 | UX | Nav reorder, Portfolio enrichment (composition strip, sentiment chips, sponsor row) | ✅ shipped |
| #14 | UX | Discover first in nav | ✅ shipped |
| #15 | UX | Deal hero images on cards (themed Unsplash CDN URLs) | ✅ shipped |
| #16 | UX | Analytical depth (4 components: AssetClassAllocation, InstrumentBreakdown, ConcentrationMetrics, LiquidityTimeline) | ✅ shipped |
| #17 | feat | Recommendations panel v1 (rules-based scoring) | ✅ shipped |
| #18 | feat | Recommendations v2 (continuous multi-factor scoring) | ✅ shipped |
| #19 | feat | Sentiment continuous scoring (no more 100% saturation) | ✅ shipped |

Open against the original V2_PLAN:

| Plan-ref | Feature | Status |
|----------|---------|--------|
| A2 | Term sheet PDFs in Supabase Storage | ❌ not started |
| A3 | Live investment feed on **Landing** (Dashboard part is done) | ⚠️ partial |
| B1 | pgvector semantic deal search | ❌ not started |
| B2 | Live deal raise progress (UPDATE subscription on deals) | ❌ not started |
| C1 | KYC document upload + admin approval | ❌ not started |
| C2 | Audit log (Postgres trigger → Realtime admin view) | ❌ not started |

Loose ends not in original plan but worth doing:

- Phase 0 hardening: RLS policies, test suite, orphan auth.users cleanup
- Phase B engineering quality: CI workflow, ErrorBoundary, lazy-loaded Recharts
- Performance: 403 KB recharts chunk on initial load

---

## How to read this doc

Each feature block is the same shape:

- **Goal** — one sentence
- **Why** — business and technical rationale (so the decision is defensible in an interview)
- **Files** — exact paths to add or edit
- **Code shape** — key signatures or pseudo-code (not full implementations — those live in PRs)
- **Test plan** — concrete behavioral checks
- **Effort** — solo developer hours, assuming you know the codebase
- **Depends on** — explicit dependencies

---

## Architectural principles (locked from v1, do not violate)

These are constraints on every feature below.

1. **Hybrid architecture**. Express owns deal/investment **writes**; browser
   talks directly to Supabase for **Storage**, **Realtime**, and **Auth**.
   Do not move write logic into the browser. Do not put business logic in
   Postgres functions.

2. **One concern per file**. A component renders. A hook owns one data source.
   A service runs one set of queries. A route does the Express plumbing.
   Tests live next to the file they test (`X.ts` + `X.test.ts`).

3. **Pure services, thin routes**. Routes are Express adapters — parse params,
   call a service, format response. All business logic in `services/*.ts`
   with no Express imports. Makes services unit-testable in isolation.

4. **Weights and thresholds as named constants** at the top of the file. No
   magic numbers buried in branches. See `sentiment.ts`'s `BASE`, `LTV_PIVOT`,
   `BULLISH_THRESHOLD` and `recommendations.ts`'s `WEIGHTS`.

5. **Continuous scoring over boolean flags**. Where a real-world signal is
   continuous (LTV, IRR, maturity), score it continuously with a clamped
   linear function. Boolean flags collapse differentiation.

6. **Frontend and backend strictly separated**. Frontend types live in
   `frontend/src/types/`, derived from but not imported from backend code.
   API contracts are JSON, documented in the `api/*.ts` modules.

---

## Phase 0 — Hardening (must-do, ~4h)

These are not in the original V2 plan but block shipping more features safely.

### P0.1 — Row-Level Security on deals + investments  (~1h)

**Goal.** Turn on Postgres RLS for `public.deals` and `public.investments`
with policies that allow the browser anon key to read deals freely, read
only its own investments, and never write to either directly.

**Why.** Supabase advisor currently flags this:
> "2 table(s) have Row Level Security disabled... anyone with the anon
> key can read or modify every row."

Writes happen via Express (which uses the service role), so flipping RLS
on the browser path costs us nothing functional. It hardens the demo
against any visitor pulling the anon key out of the bundle and POSTing
malicious rows directly to Supabase REST.

**Files.**
- `backend/prisma/migrations/20260527_enable_rls/migration.sql` — new
- `backend/prisma/schema.prisma` — no change (RLS is enforced at DB level,
  Prisma queries via service role bypass it anyway)
- `backend/tests/rls.test.ts` — new (verifies policies are correct)

**Code shape.**
```sql
-- deals: read for everyone, no writes from browser
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_select_all ON public.deals
  FOR SELECT USING (true);

-- investments: SELECT only own rows, no INSERT/UPDATE/DELETE from browser
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY investments_select_own ON public.investments
  FOR SELECT USING (auth.uid() = "userId");
-- INSERT/UPDATE/DELETE: no policy → blocked for anon, allowed for service_role
```

**Test plan.**
- Anon client SELECT `deals` → returns all 10 ✓
- Anon client SELECT `investments` without auth → returns 0 rows ✓
- Anon client with user JWT SELECT `investments` → returns only that user's rows ✓
- Anon client INSERT `investments` → 403 / RLS violation ✓
- Service-role client (Express backend) reads/writes unchanged ✓

**Effort.** 1h (migration + verification queries).

**Depends on.** Nothing.

---

### P0.2 — Delete orphan auth.users row  (~15min)

**Goal.** Remove the `recruiter@yeldo.com` user created in error during
the v2-a1 migration session. One-off cleanup, no code.

**Why.** The wrong-email user is still sitting in `auth.users`. Doesn't
affect functionality, but cosmetic during interviews if anyone opens the
Supabase dashboard.

**Files.** None. Single `DELETE` on `auth.users` via dashboard or SQL.

**Test plan.**
- `SELECT count(*) FROM auth.users` before/after → drops from 2 to 1.
- Frontend login as `ferdinand.straehuber@gmail.com` still works ✓.

**Effort.** 15 min, mostly dashboard navigation.

**Depends on.** Nothing.

---

### P0.3 — Test scaffold: Vitest on backend services  (~3h)

**Goal.** Add Vitest to `backend/`. Write tests for the three pure
services: `sentiment.ts`, `recommendations.ts`, `portfolio.ts`. No
integration tests yet — just unit tests for the math.

**Why.** Zero tests today. Adding any new feature without a test scaffold
will keep racking up untested code. Pure services are the perfect place
to start because they have no Express, no Prisma queries to mock at the
unit-test layer — they take data in, return data out.

A test file next to `sentiment.ts` is the single clearest "this person
writes production code" signal in the repo.

**Files.**
- `backend/vitest.config.ts` — new (minimal config, native ESM)
- `backend/package.json` — add `test`, `test:watch`, `test:coverage` scripts
- `backend/tests/sentiment.test.ts` — new
- `backend/tests/recommendations.test.ts` — new
- `backend/tests/portfolio.test.ts` — new
- `backend/tests/fixtures.ts` — new (shared deal/investment fixtures)
- `.github/workflows/ci.yml` — new (runs test + typecheck on every PR)

**Code shape.**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], globals: true, environment: 'node' },
});
```

`tests/sentiment.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeSentiment } from '../src/services/sentiment';
import { lowLtvSeniorFirstLien, highLtvMezzNoLien } from './fixtures';

describe('computeSentiment', () => {
  it('produces a bullish label with score ~0.80 for low-LTV senior first-lien', () => {
    const result = computeSentiment(lowLtvSeniorFirstLien); // LTV 35, senior_loan, 24mo, lien
    expect(result.label).toBe('bullish');
    expect(result.score).toBeCloseTo(0.8, 1);
  });
  it('produces a cautious label for high-LTV mezzanine without first-lien', () => {
    const result = computeSentiment(highLtvMezzNoLien); // LTV 61, mezzanine, 30mo, no lien
    expect(result.label).toBe('cautious');
    expect(result.score).toBeLessThanOrEqual(0.4);
  });
  it('LTV scoring is continuous (35% scores higher than 39% scores higher than 41%)', () => {
    // ... three deals identical except LTV; assert score ordering
  });
});
```

`tests/recommendations.test.ts`:
```ts
describe('getRecommendations scoring', () => {
  it('excludes deals the user already holds', () => { /* ... */ });
  it('ranks unowned-country deals above same-country deals when other factors are equal', () => { /* ... */ });
  it('factor weights sum to 1.0', () => {
    const total = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
  it('returns at most `limit` items', () => { /* ... */ });
  it('handles empty portfolio (cold-start case)', () => { /* ... */ });
});
```

`tests/portfolio.test.ts`:
```ts
describe('getPortfolioKPIs', () => {
  it('returns zeroed KPIs for empty portfolio', () => { /* ... */ });
  it('computes amount-weighted IRR correctly', () => { /* ... */ });
  it('country allocation percentages sum to 100', () => { /* ... */ });
});
```

`tests/fixtures.ts`:
```ts
// Reusable deal + investment factories with sane defaults.
// Each fixture should be the minimum-spec object that exercises one branch.
```

**Test plan (meta — how do we know the test scaffold itself works?).**
- `npm test` from `backend/` runs all three files, all pass.
- `npm run test:coverage` outputs ≥ 80% line coverage on the three services.
- CI workflow runs the same `npm test` on every PR.

**Effort.** 3h. Vitest config (15min), fixtures (30min), sentiment tests
(45min), recommendations tests (60min), portfolio tests (30min), CI (15min).

**Depends on.** Nothing (Vitest works in isolation).

---

## Phase A — V2 demo features (~13h)

The user-visible features from the original V2 plan.

### A2 — Term sheet PDFs in Supabase Storage  (~3h)

**Goal.** Each deal has a downloadable one-page "term sheet" PDF. Files
live in a public Supabase Storage bucket. Frontend renders a "Download
factsheet" button on the deal detail page.

**Why.** Real PE/RE deals always show factsheets. Adding one tangible
artifact the recruiter can click and download is high-signal: it
demonstrates Supabase Storage usage and gives the demo a sense of
"real product" not just "a database with a UI on top".

**Files.**

Backend:
- `backend/scripts/generate-deal-pdfs.ts` — new (one-shot script: render
  HTML template per deal, save to /tmp, upload to bucket)
- `backend/scripts/templates/factsheet.html` — new (Handlebars-ish template)
- `backend/prisma/seed.ts` — update with `pdfUrl` on each deal
- `backend/prisma/schema.prisma` — add `pdfUrl String?` to `Deal`

Frontend:
- `frontend/src/types/deal.ts` — add `pdfUrl: string | null`
- `frontend/src/components/DealDocuments.tsx` — new
- `frontend/src/pages/DealDetailPage.tsx` — import + render

Storage:
- Create bucket `deal-documents` in Supabase dashboard (public read,
  service-role write).

**Code shape.**

```ts
// backend/scripts/generate-deal-pdfs.ts
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { prisma } from '../src/lib/prisma';

const PDF_BUCKET = 'deal-documents';

async function main() {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const browser = await puppeteer.launch();
  const deals = await prisma.deal.findMany();
  for (const deal of deals) {
    const html = renderTemplate(deal);            // Handlebars
    const pdfBuffer = await renderToPdf(browser, html);
    const path = `${deal.slug}.pdf`;
    await admin.storage.from(PDF_BUCKET).upload(path, pdfBuffer, {
      contentType: 'application/pdf', upsert: true,
    });
    const { data } = admin.storage.from(PDF_BUCKET).getPublicUrl(path);
    await prisma.deal.update({ where: { id: deal.id }, data: { pdfUrl: data.publicUrl } });
  }
}
```

```tsx
// frontend/src/components/DealDocuments.tsx
export function DealDocuments({ deal }: { deal: Deal }) {
  if (!deal.pdfUrl) return null;
  return (
    <a href={deal.pdfUrl} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-2 ...">
      <DocumentIcon /> Download factsheet (PDF)
    </a>
  );
}
```

**Test plan.**
- `backend/tests/pdf-upload.test.ts` — mocks Supabase Storage client,
  verifies the script calls upload with the right path and content-type.
- Manual: open `/deals/mas-den-bruno`, click button, file downloads.
- Manual: open the PDF, all 6 KPI fields are populated and not "undefined".

**Effort.** 3h. Template (45min), Puppeteer render (45min), upload script
(30min), schema + frontend (30min), seed integration + test (30min).

**Depends on.** Nothing.

---

### A3-rest — Landing ActivityTicker  (~30min)

**Goal.** Tiny strip on the landing page showing the most recent investment,
updated in realtime. "€12,000 just invested in Mas d'en Bruno · 2m ago".

**Why.** Recruiter lands on the URL before logging in. They see motion
within 5 seconds of page load. Strongest "this thing is alive" signal
we can give a non-authed visitor. Original V2 plan A3 specified the
landing page as the placement — Dashboard placement was a detour.

**Files.**
- `frontend/src/components/ActivityTicker.tsx` — new (reuses
  `useRecentActivity` + `useInvestmentLiveFeed` hooks already shipped)
- `frontend/src/pages/Landing.tsx` — import + render above the CTAs

**Code shape.**
```tsx
// Reuses the SAME hooks as ActivityFeed (DRY). Only the presentation
// differs — single line, fixed height, no border, slowly auto-rotates
// if multiple events are queued.
export function ActivityTicker() {
  const { data: snapshot } = useRecentActivity(3);
  const { items, connected } = useInvestmentLiveFeed(snapshot, 3);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIdx(i => (i + 1) % items.length), 4000);
    return () => clearInterval(id);
  }, [items.length]);
  const active = items[idx];
  if (!active) return null;
  return (
    <div className="flex items-center gap-3 text-sm ...">
      <PulseDot connected={connected} />
      <span>{formatEuro(active.amount)} just invested in {active.dealName} · {timeAgo(active.investedAt)}</span>
    </div>
  );
}
```

**Test plan.**
- `frontend/src/components/ActivityTicker.test.tsx` (jsdom + Vitest):
  render with 3 mocked items, advance fake timer 4s, expect item 2 visible.
- Manual: open / in a fresh browser, ticker appears within 1s, rotates.

**Effort.** 30min.

**Depends on.** Realtime already enabled on `public.investments` (done).

---

### B2 — Live deal raise progress  (~3h)

**Goal.** Each `DealCard` and `DealDetailPage` subscribes to UPDATE events
on its row in `public.deals`. When `raisedAmount` changes, the progress
bar smoothly animates to the new percentage and a "LIVE" badge appears.

**Why.** Realtime on the deal grid is the visual flourish that turns a
static catalog into a "live marketplace". Demos extremely well — three
deals filling up simultaneously while the recruiter watches.

**Files.**
- `frontend/src/hooks/useDealLive.ts` — new (subscribe per dealId)
- `frontend/src/components/DealCard.tsx` — wire up
- `frontend/src/components/DealHero.tsx` — same

Also requires enabling UPDATE replication on `public.deals`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
```

**Code shape.**
```ts
export function useDealLive(dealId: string, initial: number) {
  const [raised, setRaised] = useState(initial);
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    const channel = supabase.channel(`deal-${dealId}`)
      .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'deals', filter: `id=eq.${dealId}` },
          (payload) => {
            setRaised((payload.new as { raisedAmount: number }).raisedAmount);
            setPulsing(true);
            setTimeout(() => setPulsing(false), 1500);
          })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dealId]);
  return { raised, pulsing };
}
```

**Test plan.**
- Backend integration: POST an investment via Express, watch the deal's
  `raisedAmount` update in the DB, then assert the Realtime channel
  payload would fire (mock Supabase client).
- Manual: open Discover in tab A, POST investment from terminal, see
  bar animate in tab A within 1s.

**Effort.** 3h. Hook (45min), wire-up (45min), animation polish (45min),
tests + manual verification (45min).

**Depends on.** A3 ActivityFeed pattern (already shipped).

---

### A4 — Demo activity bot  (~1h, polish)

**Goal.** Small Node script that, when run, inserts fake investments
every 60–90s. Used during recruiter demos so the activity feed always
shows movement and B2 progress bars wiggle.

**Why.** Without this, the activity feed shows the same 6 investments
forever. Bot creates ambient motion for the demo. Not run in CI/prod
constantly — manual invocation before a demo.

**Files.**
- `backend/scripts/demo-activity-bot.ts` — new
- `backend/package.json` — add `bot:demo` script
- `RECRUITER_GUIDE.md` — note "for full effect, run `npm run bot:demo`
  in another terminal".

**Code shape.**
```ts
async function tick() {
  const openDeals = await prisma.deal.findMany({ where: { status: 'open' } });
  const deal = randomItem(openDeals);
  const amount = randomBetween(2_000, 25_000);
  await prisma.investment.create({ data: { userId: DEMO_USER, dealId: deal.id, amount } });
  await prisma.deal.update({ where: { id: deal.id }, data: { raisedAmount: { increment: amount } } });
}
setInterval(tick, randomBetween(60_000, 90_000));
```

**Test plan.**
- Manual: run script, watch DB for new rows, watch live site for ticker
  updates. Stop with Ctrl+C.
- No unit tests — script is glue.

**Effort.** 1h.

**Depends on.** A3 (so the activity has somewhere to surface) — done.

---

### B1 — pgvector semantic deal search  (~6h)

**Goal.** "Find deals similar to Mas d'en Bruno" and "Show me deals where
the narrative mentions luxury hospitality with low LTV" — both work via
vector cosine similarity on OpenAI embeddings stored in Postgres.

**Why.** Yeldo is a real-estate ML platform. This is the single most
thematically aligned feature in the V2 plan. Demonstrates: you understand
embeddings, you know how to choose between Postgres-native and external
vector stores, you can write hybrid SQL (semantic + structured filters).

**Files.**

Backend:
- `backend/prisma/migrations/20260528_enable_pgvector/migration.sql` — new
  (`CREATE EXTENSION IF NOT EXISTS vector; ALTER TABLE deals ADD COLUMN embedding vector(1536);`)
- `backend/prisma/schema.prisma` — add `embedding Unsupported("vector(1536)")?`
- `backend/scripts/compute-embeddings.ts` — new (one-shot: OpenAI
  text-embedding-3-small for each deal's narrative, upsert)
- `backend/src/services/semanticSearch.ts` — new
- `backend/src/routes/semanticSearch.ts` — new (POST `/api/deals/search`)
- `backend/src/index.ts` — mount route
- `backend/tests/semanticSearch.test.ts` — new

Frontend:
- `frontend/src/types/semanticSearch.ts` — new
- `frontend/src/api/semanticSearch.ts` — new
- `frontend/src/hooks/useSemanticSearch.ts` — new (debounced, search-as-you-type)
- `frontend/src/components/SemanticSearchBox.tsx` — new
- `frontend/src/pages/Discover.tsx` — toggle between keyword and semantic mode

**Code shape.**

`backend/src/services/semanticSearch.ts`:
```ts
import OpenAI from 'openai';
import { prisma } from '../lib/prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function semanticSearch(query: string, limit = 5) {
  // 1. embed the query
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const vector = embedding.data[0].embedding; // number[1536]

  // 2. cosine similarity via pgvector's <=> operator
  const results: Array<{ id: string; slug: string; name: string; similarity: number }> =
    await prisma.$queryRaw`
      SELECT id, slug, name,
             1 - (embedding <=> ${vector}::vector) AS similarity
      FROM public.deals
      WHERE embedding IS NOT NULL AND status = 'open'
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit};
    `;
  return results;
}
```

`backend/scripts/compute-embeddings.ts`:
```ts
// For each deal, embed: `${name}. ${location}. ${assetClass}. ${description}. Sponsor: ${sponsorDescription}`.
// One-shot; ~10 API calls; ~$0.02 total at text-embedding-3-small pricing.
// Idempotent: re-runs only deals where embedding IS NULL.
```

`frontend/src/components/SemanticSearchBox.tsx`:
```tsx
// Debounced input (400ms). Two modes: keyword (existing) vs semantic.
// When the user types in semantic mode, hits /api/deals/search and
// re-renders the Discover grid with returned deals ordered by similarity.
// Each card shows a similarity bar (0.0–1.0).
```

**Test plan.**
- `tests/semanticSearch.test.ts` — mocks OpenAI client, asserts SQL query
  is built correctly, asserts ordering by similarity desc.
- Manual: embed all 10 deals (run script), type "luxury alpine hotel"
  → top result is Alpine Resort Cortina.
- Manual: type "industrial conversion near Milan" → top result is Varedo
  ex SNIA.
- Sanity: query with no embeddings present → returns empty list, not 500.

**Why pgvector and not Pinecone.** Embeddings live in the same DB as the
rows they describe, so there's no two-store consistency problem (insert a
new deal → embedding can be backfilled by the same script that owns
seed data). No second SaaS, no second cost line. Trade-off: at 1M+ rows
you'd want a dedicated index — we are at 10.

**Why text-embedding-3-small vs OpenAI's larger model.** 1536 dimensions
is plenty for 10 deals worth of disambiguation. The "large" model is
overkill for this scale and doubles storage. Both cost ~$0.02 here.

**Effort.** 6h. Migration + extension (30min), compute script (60min),
service + route (60min), tests (60min), frontend search box (90min),
debounce + UX polish (30min), end-to-end verification (30min).

**Depends on.** OpenAI API key in Railway env (user provides). pgvector
extension enabled in Supabase (one click).

---

## Phase B — Engineering quality (~6h)

These are not visible features but signal to recruiters that you treat
this as production code.

### Q1 — CI workflow (~1h)

**Goal.** Every PR triggers GitHub Actions: backend typecheck + tests,
frontend typecheck + build. Status check blocks merge if any step fails.

**Why.** Without CI, the test suite is decorative. CI converts "tests
exist" into "broken code can't ship". Cheapest possible signal of
engineering hygiene.

**Files.**
- `.github/workflows/ci.yml` — new

**Code shape.**
```yaml
name: CI
on: [pull_request, push]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm', cache-dependency-path: 'backend/package-lock.json' }
      - working-directory: backend
        run: |
          npm ci
          npm run typecheck
          npm test
  frontend:
    # ... mirror of above for frontend/, with npm run build at the end
```

**Test plan.**
- Open a PR with a deliberate type error → CI fails red.
- Open a PR with a failing test → CI fails red.
- Open a PR with clean code → CI passes green.

**Effort.** 1h. Mostly tuning cache paths.

**Depends on.** P0.3 (need tests for CI to be meaningful).

---

### Q2 — Health endpoint upgrade (~30min)

**Goal.** `/health` returns more than `{ ok: true }` — also: version
(from `package.json`), uptime, DB connectivity (Prisma `SELECT 1`),
and JWKS reachability.

**Why.** Useful in production (Railway has built-in health checks).
Useful in interviews (gives you a 30-second talking point about
operational maturity).

**Files.**
- `backend/src/routes/health.ts` — new (extract from `index.ts`)
- `backend/src/index.ts` — mount

**Code shape.**
```ts
router.get('/', async (_req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    return res.status(503).json({ ok: false, error: 'DB_UNREACHABLE' });
  }
  res.json({
    ok: true,
    service: 'yeldo-backend',
    version: process.env.npm_package_version,
    uptimeSeconds: Math.floor(process.uptime()),
    dbLatencyMs: Date.now() - start,
    ts: new Date().toISOString(),
  });
});
```

**Test plan.** Test asserts shape (uptime > 0, dbLatencyMs >= 0).

**Effort.** 30min.

**Depends on.** Nothing.

---

### Q3 — React ErrorBoundary (~30min)

**Goal.** Wrap the app root in an ErrorBoundary. When any component
throws, show a friendly fallback page with a "Reload" button instead
of a white screen.

**Why.** Currently any unhandled render error crashes the whole app to
white. ErrorBoundary is one component, ships in 30min, makes the
product feel resilient.

**Files.**
- `frontend/src/components/ErrorBoundary.tsx` — new
- `frontend/src/App.tsx` — wrap `<Layout />` in it
- `frontend/src/components/ErrorBoundary.test.tsx` — new

**Code shape.** Standard React class-component ErrorBoundary with
`componentDidCatch` → log to console (or Sentry in Q5).

**Test plan.** Render a child that throws, expect fallback UI to appear.

**Effort.** 30min.

**Depends on.** Nothing.

---

### Q4 — Defer Recharts on DealDetailPage (~30min, shipped)

**Status.** Shipped. Scope was narrower than the original plan after
measuring the actual bundle behavior — see "Revised after measurement"
below.

**Original (incorrect) premise.** "First paint includes 403 KB of
recharts even on Landing where no chart is rendered. Code-splitting
cuts initial bundle by ~25%."

**Revised after measurement.** The original plan assumed Recharts
sits on Landing's critical path. It doesn't. Inspecting the build:

  Landing's HTML modulepreloads only:
    vendor-react      (164 KB raw / 54 KB gzipped)
    vendor-toast      ( 12 KB raw /  5 KB gzipped)
    vendor-forms      ( 80 KB raw / 22 KB gzipped)
    + index.js        (~230 KB / 62 KB gzipped, contains Landing source)

  vendor-recharts is NOT preloaded. It's lazily fetched when a page
  that uses it activates (Dashboard, Portfolio, or DealDetailPage).

**What did need fixing.** `DealDetailPage` statically imported
`DealFinancials`, which statically imports `CashflowChart`, which
imports `recharts`. So opening any deal-detail page downloaded
the 410 KB recharts chunk even if the user never clicked the
Financials tab. The other tabs (Overview, Risks, Sponsor, Updates,
Documents) don't need recharts.

**Fix.** Wrap `DealFinancials` in `React.lazy` inside
`pages/DealDetailPage.tsx`. recharts is now only fetched when
`tab === 'financials'` renders for the first time.

**Result.** A new `DealFinancials-*.js` chunk (5.30 KB raw /
1.84 KB gzipped) holds the static deps; recharts pulls in only
when the user opens the Financials tab.

**Not done (would not help).** Lazy-loading `ForecastChart` /
`DonutChart` on Dashboard or Portfolio — those pages render charts
on first paint, so lazy would just delay the first paint.

**Test plan.**
- `npm run build` outputs a `DealFinancials-*.js` chunk separate
  from `DealDetailPage-*.js`.
- The DealDetailPage chunk's static dep graph does NOT reference
  recharts.

**Lesson learned.** Measure before optimizing. The original V2 plan
assumed the wrong cost model; a 5-second `npm run build` + look at
the chunk list saved an hour of work in the wrong place.

**Depends on.** Nothing.

---

### Q5 — Sentry-style client error logging (~1h, optional)

**Goal.** Frontend errors get sent to a free Sentry project. Backend
crashes / unhandled promise rejections same.

**Why.** Recruiter asks "how do you know if something breaks for a user?"
— you have an answer.

**Files.**
- `frontend/src/lib/sentry.ts`, init in `main.tsx`
- `backend/src/lib/sentry.ts`, init in `index.ts`
- `SENTRY_DSN` in Vercel + Railway envs

**Code shape.** Standard Sentry init. Tag releases with git SHA.

**Test plan.** Throw in a component, see event in Sentry dashboard.

**Effort.** 1h.

**Depends on.** Sentry account (free).

---

## Phase C — Production-grade theater (~18h, optional)

Only worth it if interviewing for senior roles where compliance/audit
comes up. Skip otherwise.

### C1 — KYC document upload flow (~10h)

**Goal.** `/account/verification` page with drag-and-drop upload to a
private Supabase Storage bucket. Files scoped by RLS to the uploading
user. Admin route (env-gated allowlist) to flip `kycStatus`.

**Why.** Shows: private bucket usage, RLS on storage paths, file MIME
validation, file size limits, audit trail (when did this user upload).
Standard fintech onboarding pattern.

**Files.** ~10 new files (page, components, hook, admin route, RLS
policies on `storage.objects`).

**Effort.** 10h. The complexity is in the RLS policies on
`storage.objects` (per-user-path access) and the admin UI gating.

**Depends on.** P0.1 RLS work pattern established.

---

### C2 — Audit log (~8h)

**Goal.** Postgres trigger inserts into an `audit_log` table on every
mutation of `investments`, `users`, `deals`. Admin-only `/admin/activity`
page subscribed to Realtime feed of `audit_log`.

**Why.** Compliance posture for fintech. Demonstrates: Postgres triggers,
generic audit pattern, admin-only routing.

**Files.** Migration for trigger + audit table, admin page, admin
middleware.

**Effort.** 8h.

**Depends on.** Admin-gating pattern from C1.

---

## Recommended ship order

1. **P0.1 RLS** — 1h. Single migration. Lowest effort, highest security
   impact. Do this first so all subsequent feature work happens with the
   correct permission model.
2. **P0.3 Test scaffold + P0.2 orphan cleanup** — 3h. Vitest + first 3
   test files. Delete orphan user via dashboard. Test scaffold enables
   everything below.
3. **Q1 CI workflow** — 1h. Pair with P0.3 — tests need CI to be
   load-bearing.
4. **Q3 ErrorBoundary + Q2 Health upgrade** — 1h combined. Quick wins.
5. **B1 pgvector semantic search** — 6h. The ML showcase. Add tests
   alongside (now possible).
6. **A2 Term sheet PDFs** — 3h. Tangible product polish.
7. **A3-rest Landing ActivityTicker + B2 Live raise** — 4h combined.
   Realtime polish bundle.
8. **A4 Activity bot** — 1h. Demo polish.
9. **Q4 Lazy-load Recharts** — 1h. Performance.
10. **Q5 Sentry** — 1h. Optional.
11. **C1 + C2** — 18h. Only if needed for senior interviews.

**Total for the recommended set (steps 1–10):** ~22h. Two weekend-equivalents.

---

## Effort summary

| Phase | Hours | What you get |
|-------|------:|--------------|
| Phase 0 hardening | ~4h | Security + test foundation + cleanup |
| Phase A demo features | ~13h | PDFs, landing ticker, live progress, bot, pgvector |
| Phase B engineering quality | ~6h | CI, health, ErrorBoundary, lazy-load, Sentry |
| Phase C production theater | ~18h | KYC, audit log |
| **Recommended subtotal (0 + A + B)** | **~23h** | Full V2 minus optional theater |
| Full V2 (all phases) | ~41h | Everything |

---

## When this plan changes

This document is the source of truth for v2 sequencing. Update it whenever:

- A PR ships a feature listed above → strike through the row in "Status today"
- A new gap is discovered → add a new feature block in the right phase
- An assumption is invalidated (e.g. recharts code-split doesn't help measurably) → annotate the feature block with "skipped because…"

Keeping this doc current is how the engineering judgment shown here stays
visible to the next reader.
