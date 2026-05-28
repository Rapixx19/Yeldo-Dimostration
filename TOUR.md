# Codebase tour

> A 5-minute guide for recruiters and new contributors. If you only have
> time to read one file before opening the rest, read this one.

---

## Top-level layout

```
backend/    Express + Prisma + Postgres API
frontend/   React + Vite + TypeScript SPA
docs/       Architecture notes, ML methodology, original specs
V2_PLAN.md  Full forward roadmap (phases, per-feature decision logs)
ARCHITECTURE.md  Original v1 decision record
```

---

## Backend (`backend/src/`)

```
index.ts            App entry. Mounts every router. Reads CORS, port, env.
lib/                Shared utilities — prisma client, supabase client,
                    openai client (lazy). One file per concern.
middleware/         Express middleware. auth.ts verifies Supabase JWTs
                    via JWKS (ES256) with HS256 fallback.
routes/             Express adapters. Parse params → call a service →
                    format response. NO business logic here.
services/           Business logic. NO Express imports. Pure functions
                    where possible. Unit-tested in backend/tests/.
schemas/            Zod validation schemas. One file per request shape.
```

Test layout mirrors source:

```
backend/tests/
  fixtures.ts                          Reusable factories (makeDeal, makeInvestment)
  services/sentiment.test.ts           Tests for src/services/sentiment.ts
  services/portfolio.test.ts           etc.
  services/recommendations.test.ts
  services/semanticSearch.test.ts
```

37 unit tests, 90%+ coverage on tested services. CI runs them on every PR.

---

## Frontend (`frontend/src/`)

```
pages/              Top-level routes (Landing, Discover, Portfolio,
                    Dashboard, DealDetailPage, ...). Thin shells —
                    most of the work lives in components and hooks.
components/         One component per file. Single concern.
hooks/              Data hooks (useDeals, useInvestments, usePortfolio,
                    useRecentActivity, useSemanticSearch, ...).
                    Returns { data, isLoading, error } shape.
api/                Axios wrappers — one file per API namespace.
                    These are the ONLY files that know about HTTP.
contexts/           AuthContext (Supabase auth state + helpers).
types/              Shared TypeScript types. Mirror of backend types
                    but defined locally — frontend never imports from
                    backend code.
lib/                Pure utilities — formatters, math, regex parsers.
                    No React, no Axios.
```

---

## Where to find things (deep links)

### The live activity feed
A recruiter clicks the Dashboard, sees "🔴 LIVE — Recent activity" updating in real time. How?

```
frontend/src/components/ActivityFeed.tsx          → composes the UI
frontend/src/hooks/useRecentActivity.ts           → initial fetch (snapshot)
frontend/src/hooks/useInvestmentLiveFeed.ts       → Supabase Realtime subscription
frontend/src/api/activity.ts                      → HTTP calls
backend/src/routes/activity.ts                    → /api/activity/* endpoints
backend/src/services/activity.ts                  → DB queries + anonymization
```

### Deal recommendations
A 5-factor weighted scoring algorithm with continuous (not boolean) sub-scores.

```
backend/src/services/recommendations.ts           → WEIGHTS constant at the top,
                                                    factor scorers below
backend/tests/services/recommendations.test.ts    → invariant: weights sum to 1.0
frontend/src/components/RecommendationsPanel.tsx  → card layout
frontend/src/components/FactorBreakdown.tsx       → per-factor row
```

### Semantic deal search (pgvector)
"Type 'luxury alpine hotel' on Discover and the right deal comes first."

```
backend/prisma/migrations/20260528000000_pgvector/  → enables pgvector + HNSW index
backend/src/services/semanticSearch.ts              → query embedding + cosine SQL
backend/src/lib/openai.ts                           → OpenAI client (lazy)
backend/scripts/compute-embeddings.ts               → one-shot, idempotent
frontend/src/components/SemanticSearchBox.tsx       → mode toggle + input
frontend/src/hooks/useSemanticSearch.ts             → 400ms debounce
```

### Sentiment (FinBERT-style)
Each deal has a BULLISH / NEUTRAL / CAUTIOUS label with a continuous score.

```
backend/src/services/sentiment.ts                 → coefficients at the top
                                                    (BASE, LTV_SLOPE, INSTRUMENT_ADJ, ...)
backend/tests/services/sentiment.test.ts          → monotonicity invariants
frontend/src/components/SentimentChip.tsx         → small chip used everywhere
frontend/src/components/SentimentWidget.tsx       → expanded card on DealDetail
```

### Auth
Supabase Auth with Google OAuth. Tokens verified via JWKS (ES256), HS256 fallback.

```
frontend/src/contexts/AuthContext.tsx             → Supabase session state
frontend/src/lib/supabase.ts                      → browser-side client
backend/src/middleware/auth.ts                    → Bearer token → req.user.id
backend/src/lib/supabase.ts                       → JWKS verifier + admin client
```

### Portfolio analytics (Dashboard + Portfolio pages)
KPIs, allocations, concentration metrics, Gantt-style liquidity timeline.

```
backend/src/services/portfolio.ts                 → amount-weighted IRR,
                                                    country allocation,
                                                    projected returns
frontend/src/lib/portfolioStats.ts                → composition metrics, HHI
frontend/src/components/CountryAllocation.tsx     → country donut
frontend/src/components/AssetClassAllocation.tsx  → asset class donut
frontend/src/components/InstrumentBreakdown.tsx   → instrument donut
frontend/src/components/DonutChart.tsx            → generic primitive used by all three
frontend/src/components/ConcentrationMetrics.tsx  → HHI, Max position, etc
frontend/src/components/LiquidityTimeline.tsx     → Gantt-style timeline
```

### Deal detail tabs
Five tabs on /deals/:slug — Overview, Financials, Risks, Sponsor, Updates, Documents.

```
frontend/src/components/DealTabs.tsx              → tab strip
frontend/src/components/DealFinancials.tsx        → cashflow chart + schedule
frontend/src/components/DealRisks.tsx             → severity summary + signals
frontend/src/components/DealSponsor.tsx           → hero + parsed track record
frontend/src/components/DealUpdates.tsx           → vertical event timeline
frontend/src/lib/dealFinancials.ts                → pure cashflow math
frontend/src/lib/sponsorFacts.ts                  → regex track-record parser
backend/prisma/migrations/20260529000000_deal_events/  → deal_events table
```

---

## Conventions (locked from v1, do not violate)

These rules are baked into the codebase. Following them keeps adding
features cheap; breaking them slows everything down.

1. **One concern per file.** A component renders. A hook owns one data
   source. A service runs one set of queries. A route is Express
   plumbing. A schema validates one request shape.

2. **Pure services, thin routes.** All business logic in
   `backend/src/services/*.ts` with no Express imports. Routes are
   adapters — parse params, call a service, format response.

3. **Weights and thresholds as named constants at the top of the file.**
   No magic numbers buried in branches. See `sentiment.ts`'s `BASE`,
   `LTV_PIVOT`, `BULLISH_THRESHOLD` and `recommendations.ts`'s
   `WEIGHTS`. Reading the constants tells you the algorithm before you
   read a single function.

4. **Continuous scoring over boolean flags.** Where a real-world signal
   is continuous (LTV, IRR, maturity), score it continuously with a
   clamped linear function. Boolean flags collapse differentiation —
   e.g. LTV 35% and LTV 39% should not get identical scores. This
   lesson cost us a rewrite during the recommender's first iteration.

5. **Frontend and backend strictly separated.** Frontend types live in
   `frontend/src/types/`, mirroring but not importing from backend
   code. API contracts are JSON, documented in `api/*.ts` modules.

6. **Hybrid Supabase architecture.** Express owns deal/investment
   writes (still). Browser talks directly to Supabase for **Auth**,
   **Storage**, and **Realtime**. RLS protects the tables the browser
   touches; Express bypasses RLS via service_role.

7. **Comments explain WHY, not WHAT.** The code already says what.
   Comments are for hidden invariants, non-obvious decisions,
   workarounds for specific bugs, and surprising behavior. A comment
   that just paraphrases the next line gets deleted.

8. **Tests live next to a clear contract.** Pure services are tested
   first — they have no infra dependencies and no excuse to be
   untested. Integration tests go in `tests/integration/` if/when we
   add them.

---

## Where the architecture explanations live

- `ARCHITECTURE.md` — the v1 decision record (why this stack, why
  Express in front, why RLS off in v1)
- `V2_PLAN.md` — current forward roadmap with per-feature decision logs
- `docs/01-database-schema.md`..`docs/12-finbert-sentiment.md` — spec
  files from the v1 build; useful background on individual subsystems
- `RECRUITER_GUIDE.md` — 5-minute product tour (vs this file's
  code-level tour)

---

## How to run things locally

```sh
# Backend
cd backend && npm ci && npm run dev      # localhost:4000
cd backend && npm test                    # unit tests
cd backend && npm run typecheck

# Frontend
cd frontend && npm ci && npm run dev     # localhost:5173
cd frontend && npm run typecheck

# Both projects build, typecheck, and (for backend) test on every PR
# via .github/workflows/ci.yml
```

---

## How to read the git history

PRs are named with a `<scope>: <change> [phase]` convention:

```
feat(b1): semantic deal search via pgvector + OpenAI embeddings
feat(deal-detail): Tab 5 of 5 — Updates (deal_events table + timeline)
ci(q1): run vitest in CI + bump pinned Node to 22
test(p0-3): Vitest scaffold + 31 tests across sentiment / portfolio / recommendations
```

Commit messages are the design doc — each one has a "Decisions"
section explaining why the change went one way and not another.
Reading the commit log of any feature gives you the design rationale
without needing to find a separate doc.
