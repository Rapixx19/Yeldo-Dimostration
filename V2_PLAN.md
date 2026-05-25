# V2 Plan — Supabase-native features

v1 shipped: React SPA on Vercel, Express API on Railway, Supabase Postgres in the back. RLS off, no anon key in the browser. See `ARCHITECTURE.md` decision log.

v2 leans into Supabase features that v1 deliberately didn't use — Storage, Realtime, Auth, pgvector — for features that would be painful to build from scratch but trivial with the platform.

---

## Architecture for v2 — Hybrid

Three options on the table; **hybrid is the pick**:

| Option | What it means | Why not |
|---|---|---|
| Full Supabase-native | Browser → Supabase directly for everything, RLS everywhere, drop Express | Loses Express as the place for business logic (sentiment, IRR, validation). Postgres functions / Edge Functions add operational complexity. Rewrites v1. |
| Express in front of everything | Use Supabase Storage/Realtime via server SDK | Kills the "5 lines" benefit — at that point S3 + a self-hosted WebSocket are comparable effort. |
| **Hybrid** | Express owns deal/investment writes (current arch unchanged). Browser talks directly to Supabase for Storage, Realtime, Auth. RLS on for the tables/buckets the browser touches. | Two auth systems to reason about, but each does what it's best at. Preserves the v1 architectural decision you can defend in an interview. |

**Concrete: what runs where in v2**

| Concern | Path |
|---|---|
| Read deals, browse, filters | Browser → Express → Postgres *(unchanged)* |
| Create/cancel investment | Browser → Express → Postgres *(unchanged — keeps server-side validation)* |
| Login / signup (email + Google) | Browser → Supabase Auth → JWT *(replaces v1's custom JWT)* |
| User profile, KYC status | Browser → Supabase (RLS: own row only) |
| Document download (term sheet PDF) | Browser → Supabase Storage (signed URL or public read) |
| KYC document upload | Browser → Supabase Storage (RLS: scoped to user, bucket private) |
| Live investment feed | Browser subscribes to Supabase Realtime on `investments` table |
| Deal raise progress bar | Browser subscribes to Supabase Realtime on `deals.amountRaised` |
| Audit log | Postgres trigger → audit table → Realtime push to admin UI |

**Migration cost** — biggest one is **Auth**. v1 has its own bcrypt + JWT in `backend/src/auth/`. Moving to Supabase Auth means:
- Frontend: replace `useAuth` token storage with Supabase client
- Backend: validate Supabase JWTs (their public key, `jose` lib) instead of signing our own
- Existing users: one-time migration script (or just nuke seed users since this is a demo)

Everything else is **additive** — new tables, new buckets, new realtime channels. No refactor of v1 code.

---

## Feature roadmap

Ordered by **(value to recruiter demo) × (visible polish) / (effort)**. Effort in hours assuming you know the codebase.

### Phase A — high demo value, low effort (1 weekend total)

#### A1. Google login via Supabase Auth
**~4h.** Replaces email/password with one-click Google. Looks instantly more professional in the recruiter tour.
- Enable Google provider in Supabase dashboard (15 min)
- Replace `useAuth` hook to use `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Backend: swap JWT verification for Supabase JWT verify (their public JWKS endpoint)
- Add "Continue with Google" button next to existing demo recruiter login

**Demo value: high.** First thing a recruiter sees on the landing page.

#### A2. Term sheet PDFs on deal detail page
**~3h.** Right now `DealDetailPage` has no documents. Real PE deals show factsheets.
- Create Supabase Storage bucket `deal-documents` (public read, only service role write)
- Upload 10 fake one-page PDFs via Supabase dashboard (or generate via puppeteer from the existing deal data)
- Add `documents` jsonb field to `deals` table, seed with file names
- Frontend: "Download factsheet" button → public Supabase URL

**Demo value: high.** Tangible artifact a recruiter can click and download.

#### A3. Live investment feed on landing page
**~4h.** "€500K just invested in Rovello 14 · 2 minutes ago" ticker. Demonstrates realtime knowledge.
- Enable Realtime on `investments` table in Supabase dashboard
- Frontend: `supabase.channel('public:investments').on('postgres_changes', { event: 'INSERT' }, handler)`
- Landing page: small toast/banner shows latest 3 events
- Seed a small node script that inserts fake investments every 30-90s so the demo always has activity

**Demo value: very high.** Most visceral "this is alive" signal in fintech demos.

### Phase B — smart features (1 week total)

#### B1. AI deal search via pgvector
**~12h.** "Find me deals similar to Mas d'en Bruno" / "Show me deals where the FinBERT sentiment is bullish AND the LTV is under 40%".
- Enable `pgvector` extension on Supabase (one click)
- Generate embeddings for each deal: feed `{name, location, assetClass, narrative}` to OpenAI `text-embedding-3-small` (~$0.02 for all 10 deals)
- Add `embedding vector(1536)` column to `deals` table
- Backend endpoint `POST /api/deals/semantic-search { query }` → embed query → cosine similarity → top 5
- Frontend: search box on Discover page that switches between keyword and semantic mode

**Demo value: very high.** Directly relevant to the Yeldo job (they do real-estate ML). Shows you understand vectors, not just calling APIs.

**Why pgvector and not Pinecone:** embeddings live in the same DB as the rows they reference — no two-store sync problem, no separate cost line.

#### B2. Live deal raise progress
**~3h.** Progress bar on each deal card ticks up in real time as new investments come in (uses A3's Realtime channel).
- Realtime subscription on `deals` table for the deal IDs currently visible
- When `amountRaised` updates, smoothly animate the progress bar
- "🔴 LIVE" indicator next to actively-raising deals

**Demo value: medium-high.** Looks polished, very low marginal effort if A3 is built.

### Phase C — production-grade theater (1 week total, optional)

#### C1. KYC document upload flow
**~10h.** "Upload passport" / "Upload proof of address" → status pending → admin can approve. Compliance theater that looks real.
- Private bucket `kyc-documents`, RLS: user can only read/write `auth.uid()/{passport,proof}.pdf`
- New page `/account/verification` with drag-and-drop upload
- `users.kycStatus` enum: `unverified | pending | verified | rejected`
- Admin route (gated by env-var allowlist) to flip status

**Demo value: medium.** Adds depth but recruiter probably won't go through it.

#### C2. Audit log
**~8h.** Every state change recorded; admin dashboard shows live activity stream.
- Postgres trigger on `investments`, `users`, `deals` → insert into `audit_log` table
- Admin-only `/admin/activity` page subscribed to `audit_log` Realtime channel
- Showcases compliance awareness without being core to the demo

**Demo value: low-medium.** Mostly impresses if a recruiter asks "how would you handle compliance".

---

## Total scope

| Phase | Hours | Calendar |
|---|---|---|
| A | ~11h | 1 weekend |
| B | ~15h | 1 week of evenings |
| C | ~18h | Optional polish week |

**Recommendation: do A + B only.** That's two weeks part-time, and it's everything a recruiter will actually see in a 5-minute tour. C is "I built this to be production-grade" — only worth it if you're being asked detailed system-design questions in interviews.

---

## Research prompts — paste into claude.ai

When you want to go deeper on any of these in a fresh Claude chat (cleaner than mixing into this repo session), here are pre-cooked prompts. Each one is self-contained — paste the whole block.

### On the architecture decision
> I have a React + Express + Supabase Postgres stack. v1 puts Express in front of everything and keeps RLS off. For v2 I want to add file uploads, realtime feeds, and Google login using Supabase's native features. Compare three architectures: (1) keep Express in front of everything and use Supabase server SDK; (2) hybrid — Express owns writes, browser talks directly to Supabase for Storage/Realtime/Auth with RLS on those tables only; (3) rip Express out, browser → Supabase for everything. What are the real production tradeoffs, not the marketing ones?

### On Supabase Auth migration
> I have a custom Express auth setup using bcrypt + jsonwebtoken. I want to migrate to Supabase Auth so I can add Google OAuth easily. Walk me through: (a) how to verify Supabase-issued JWTs in my Express middleware using their JWKS endpoint, (b) how to migrate existing users without forcing password resets, (c) what to do about my existing `users` table — keep it and reference `auth.users(id)`, or move everything into `auth.users`?

### On pgvector for deal similarity
> I have a Postgres table `deals` with columns (name, location, assetClass, narrative, targetIRR, ltv, etc.) for ~10 real-estate investment deals. I want to add semantic search: "find deals similar to X" or "find deals matching this natural language query." Compare: (a) using OpenAI text-embedding-3-small vs Cohere embed-v3 vs an open-source model like BGE-large for this domain, (b) what to embed — just the narrative, or a structured concatenation of all fields, (c) how to handle hybrid search (semantic + keyword + filters like LTV < 40%) in a single SQL query.

### On Supabase Realtime patterns
> I want to build a "live investment activity feed" on a fintech landing page using Supabase Realtime. Every time a new row is inserted into the `investments` table, all connected browsers should see a toast/banner. Questions: (a) what's the right pattern for filtering — server-side via RLS policy on the realtime channel, or client-side filter, (b) how to handle thundering herd if 1000 users are watching the same channel during a launch event, (c) reconnection / catch-up logic for users whose tab was backgrounded.

### On KYC document storage compliance
> I'm building a fintech demo that stores KYC documents (passport scans, proof of address) using Supabase Storage with RLS scoping files to one user. For a real product targeting EU customers, what additional layers would I need beyond Supabase's defaults — encryption-at-rest specifics, GDPR retention/deletion, audit trails for who accessed which document, redaction of EXIF metadata on upload? I'm not building this for real yet but want to know what I'd add later.

### On real-estate ML feature ideas
> I'm building a portfolio piece for a real-estate investment platform. v1 has two ML features: FinBERT sentiment scoring on deal narratives, and an IRR predictor (gradient boosting on synthetic features). For v2 I want to add ML features that would actually be useful to a real estate fund analyst — not toys. Brainstorm 5 features ranked by analyst value, each with: what it predicts, what data it needs, what model class, and how I'd evaluate it. Constraints: small dataset (~10 deals scaling to maybe 100), open-source models only, must run on a free-tier server.

### On competitor differentiation
> Yeldo is a Swiss real-estate investment platform. Direct competitors include Reental, Brickstarter, Bricksave, RealT, Stake. Look up each of these and tell me: (a) which features they have that Yeldo's public site doesn't seem to, (b) which features Yeldo has that none of them do, (c) which 2-3 features would most impress a Yeldo product person if I built them into a portfolio piece demo.

### On animation / polish patterns
> I have a fintech dashboard built with React + Vite + Tailwind. The data is real and works. The UI is functional but not delightful — no micro-animations, no loading skeletons that match the final layout, no progress bars that animate smoothly when values update via WebSocket. What's the modern stack for adding all of this in a portfolio piece without it feeling overdone? Specifically: which library (Framer Motion vs auto-animate vs CSS only), what patterns for chart-data-updating animations, and what counts as "too much" in a serious-looking finance UI.

---

## Order of operations (if you want to start tomorrow)

1. **Re-architect auth first (A1).** Everything else benefits from `supabase.auth.user()` being available client-side — RLS policies key off it, Realtime subscriptions key off it, Storage scoping keys off it.
2. **Add Storage next (A2).** Easiest possible Supabase-native feature, builds confidence in the hybrid pattern.
3. **Then Realtime (A3, B2 together).** Both use the same subscription primitive, build them in one sitting.
4. **pgvector (B1) last in Phase A+B.** Most code, but mostly isolated from the rest.
5. **C1/C2 only if interviewing for senior roles** where compliance/audit comes up.

Each step is a separate PR / merge. Each is independently shippable.
