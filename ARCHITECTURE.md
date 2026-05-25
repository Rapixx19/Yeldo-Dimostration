# Architecture

## System topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                         │
│  React 18 + TypeScript + Tailwind + Recharts + Axios                   │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ HTTPS (JSON, JWT in Authorization header)
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│            FRONTEND REPO  (deployed on Vercel)                          │
│  Vite-built static SPA + lightweight client-side routing                │
│  All UI logic, forecast computation, sentiment display                  │
│  Calls VITE_API_URL for all data                                        │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ REST over HTTPS
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│            BACKEND REPO  (deployed on Railway)                          │
│  Express 4 + TypeScript + Prisma ORM                                    │
│  JWT auth middleware + bcrypt password hashing                          │
│  Zod validation on every endpoint                                       │
│  All business logic (IRR computation, sentiment scoring)                │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ Prisma (Postgres protocol over TLS)
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│            POSTGRESQL  (Supabase managed instance, EU region)           │
│  Tables: users, deals, investments, distributions                       │
│  Row-level security: investments scoped by user_id via JWT claim        │
└────────────────────────────────────────────────────────────────────────┘
```

## Why separated frontend / backend (not Next.js fullstack)

Real production fintech platforms — including Yeldo's app at `app.yeldo.com` — separate the browser-facing UI from the API/business layer. Four concrete reasons this matters:

1. **Independent deployment cycle.** A typo fix in a UI label shouldn't require redeploying the entire transaction-processing backend. Vercel auto-deploys the frontend on push to `main`; Railway auto-deploys the backend on push to `main`. They don't interfere.

2. **Independent scaling.** A viral landing page that brings 10× traffic to the frontend doesn't impact backend capacity unless those users actually log in and make API calls. We can scale Vercel's CDN tier without touching the Railway database connection pool.

3. **Security boundary.** Sensitive operations (KYC checks, payment processing, IRR computation, sentiment scoring) live exclusively server-side. The frontend never sees the raw deal-pricing model or the bcrypt hashing salt. JWT verification happens at the API edge.

4. **Multiple clients support.** The same backend that serves the React web app can serve a future React Native mobile app, a partner API for white-label integration, or a server-side data pipeline. None of that is possible if the API logic lives inside Next.js API routes.

## Data flow examples

### A. User logs in
1. Frontend: user submits email + password to `/auth/login`
2. Frontend → Backend: `POST /api/auth/login` with `{ email, password }`
3. Backend: looks up user via `prisma.user.findUnique({ email })`
4. Backend: `bcrypt.compare(password, user.passwordHash)`
5. Backend: signs JWT with `jsonwebtoken.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })`
6. Backend → Frontend: returns `{ token, user }`
7. Frontend: stores token in `localStorage`, sets `axios.defaults.headers.Authorization = 'Bearer ' + token`
8. Frontend: navigates to `/discover`

### B. User invests in a deal
1. Frontend: user clicks *"Invest now"* with amount `50000`
2. Frontend → Backend: `POST /api/investments` with `{ dealId, amount }`, Authorization header
3. Backend: `authMiddleware` verifies JWT, attaches `req.user`
4. Backend: Zod validates body
5. Backend: checks deal exists, is open, has remaining capacity
6. Backend: `prisma.investment.create({ data: { userId: req.user.id, dealId, amount } })`
7. Backend → Frontend: returns the created investment with deal joined
8. Frontend: shows toast, navigates to `/portfolio`

### C. Portfolio dashboard renders TFT forecast
1. Frontend: `/portfolio` page mounts
2. Frontend → Backend: `GET /api/investments`
3. Backend: `prisma.investment.findMany({ where: { userId }, include: { deal: true } })`
4. Backend → Frontend: returns array of investments
5. Frontend: passes investments to `lib/forecast.generateForecast()`
6. `generateForecast()` iterates, computes scheduled distributions per investment
7. Frontend: passes result to `<ForecastChart>` (Recharts stacked area)
8. Chart renders

## Database schema (summary)

Full Prisma schema in `backend/prisma/schema.prisma`. Highlights:

```
User
  id, email (unique), passwordHash, name, createdAt
  investments[]

Deal
  id, slug (unique), name, location, country, assetClass
  instrument (enum), targetRaise, raisedAmount, targetIRR
  maturityMonths, loanToValue, distribution (enum)
  minimumTicket, status (enum), startDate, maturityDate
  sentimentLabel, sentimentScore, sentimentSignals (Json)  ← FinBERT
  sponsorName, sponsorDescription, risks (Json)
  imageUrl, createdAt
  investments[]

Investment
  id, userId (FK), dealId (FK)
  amount, investedAt
  user, deal
```

## Environment variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=<32+ random chars>
PORT=4000
CORS_ORIGIN=https://yeldo-deal-tracker.vercel.app
SEED_DEMO_PASSWORD=demo123
```

### Frontend (`frontend/.env.local`)
```
VITE_API_URL=http://localhost:4000
```

In production, `VITE_API_URL` points to the Railway deployment URL.

## Deployment topology

| Concern | Where |
|---|---|
| Frontend hosting | Vercel (auto-deploy from `frontend/` directory on push to `main`) |
| Backend hosting | Railway (auto-deploy from `backend/` directory on push to `main`) |
| Database | Supabase EU (Frankfurt) — free tier, 500MB |
| Secrets | Vercel env vars (frontend), Railway env vars (backend) |
| Custom domain | `yeldo-deal-tracker.vercel.app` (or custom domain if needed) |
| HTTPS | Automatic via Vercel and Railway |
| Backups | Supabase daily snapshots (7-day retention on free tier) |

## Decision log

Quick notes on architectural choices made during the build:

| Decision | Why |
|---|---|
| Express over Fastify or Hono | JD explicitly mentions Express; recruiter-aligned |
| Prisma over raw SQL or TypeORM | Type-safe, generates TS types, modern fintech standard |
| Custom JWT over Supabase Auth | Recruiter sees the auth code, not hidden behind SaaS |
| Vite + React over Next.js | Need separated FE/BE; Next.js encourages fullstack monolith |
| Tailwind over CSS Modules | JD mentions SASS/Less; Tailwind is modern equivalent |
| Recharts over D3 directly | Component-based, less boilerplate for chart composition |
| Single-region Supabase EU | Yeldo is European; matches data sovereignty expectation |
| 7-day JWT (no refresh tokens) | Pragmatic for portfolio piece; documented in spec as v2 upgrade |
| `lib/forecast.ts` runs client-side | Deterministic compute, no API call needed, faster UX |
| Sentiment runs at seed time only | No live ML server, no inference latency, perfect for demo |
| Supabase RLS left **disabled** on `users`/`deals`/`investments` | The browser never holds the anon key; all data flow is Browser → Express (with JWT) → Postgres via the service-role `DATABASE_URL`. RLS would protect against direct PostgREST access via the anon key, but PostgREST is not a wire we expose in this design. Enabling RLS without policies would block the Express service role too. If we ever expose Supabase REST/Realtime to the browser, flip this on and add policies. |
| Lazy-state `useState` for auth hydration | `useEffect` hydration races with the first render — `ProtectedRoute` ran with `token=null` and redirected to `/auth/login`, which then redirected back to `/discover` when the effect fired. Discovered during Phase 6 visual QA. Fixed in [`AuthContext.tsx`](frontend/src/contexts/AuthContext.tsx). |
