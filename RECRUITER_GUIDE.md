# Recruiter guide — 5 minute tour

If you're reviewing this for the Yeldo Junior Fullstack Developer role, this doc gives you a structured tour. Everything below is clickable in the live demo at [yeldo-deal-tracker.vercel.app](https://yeldo-deal-tracker.vercel.app).

---

## ⏱ The 5-minute tour

### Step 1 — Land on the demo (30 sec)
Open the live demo URL. You'll see a landing page with three calls-to-action:
- **"Sign in as recruiter"** — one-click demo access (use this)
- **Sign up** — full signup flow if you want to test it
- **Browse public deals** — anonymous mode

Click *"Sign in as recruiter"* → auto-logs you in as `ferdinand.straehuber@gmail.com` with 6 pre-populated mock investments.

**What this demonstrates:**
- Frontend route protection (you couldn't reach `/portfolio` without auth)
- JWT auth handling (token stored, sent on every request)
- Pre-population via a backend seed script

### Step 2 — Discover page (1 min)
You land on `/discover`. Things to try:
- **Click each filter chip** (Country, Asset class, Instrument, Maturity) → see the deal grid filter
- **Type in the search input** → real-time filtering
- **Hover a deal card** → subtle elevation animation
- **Click the *Mas d'en Bruno* card**

**What this demonstrates:**
- React state management for filter combinations
- Tailwind CSS responsive grid (try resizing the browser)
- REST API call to `GET /api/deals?country=ES&instrument=senior_loan`
- Hover states, transitions

### Step 3 — Deal detail page (1.5 min)
You're now on `/deals/mas-den-bruno`. Look for:
- **The BULLISH sentiment chip** in the hero (top-right, brass-coloured)
- **The FinBERT widget** below the Investment summary (sage green)
- **Click between the tabs** (Overview / Financials / Sponsor / Risks / Updates / Documents)
- **The sticky right sidebar** — scroll the page, the invest card stays visible

Then **hover the FinBERT-powered badge** — a modal opens explaining the ML feature, links to [arXiv:1908.10063](https://arxiv.org/abs/1908.10063).

**What this demonstrates:**
- Dynamic routing (`/deals/[slug]`)
- Tabbed interface using React component state
- Sticky positioning in a flex layout
- ML feature integration with educational tooltips

### Step 4 — Make a virtual investment (45 sec)
On the deal detail page, in the right sidebar:
- **Type an amount** in the input (e.g., 50000) — see the projection totals update live
- **Click a quick-amount button** (€250K, €500K, Max) — the input updates
- **Click *Invest now*** — see the loading state, then a toast confirmation

**What this demonstrates:**
- Real-time form computation (no submit needed for projection updates)
- Optimistic UI updates
- REST POST to `/api/investments` with the deal ID and amount
- Toast notification library integration
- Error handling (try investing more than the deal's remaining capacity — see the validation toast)

### Step 5 — Portfolio dashboard (1 min)
Navigate to `/portfolio`. You'll see:
- **4 KPI cards** at the top (Total invested, Weighted IRR, Projected returns, Next distribution)
- **The TFT forecast chart** — a stacked area chart showing 36 months of projected distributions
- **The country allocation donut**
- **The upcoming distributions list**
- **The active investments table** with maturity progress bars

**Things to try:**
- **Hover the TFT chart** — tooltips show per-deal distribution at that month
- **Hover the *"TFT-inspired model"* badge** — modal explains TFT with link to [arXiv:1912.09363](https://arxiv.org/abs/1912.09363)
- **Click any deal name in the investments table** → drills into that deal's detail page

**What this demonstrates:**
- Recharts composition for stacked area chart
- Mathematical forecast calculation in `lib/forecast.ts` (open the GitHub link to see annotated code)
- KPI computation across multiple investments (weighted average IRR)
- Cross-page navigation patterns

---

## ⏱ The 15-minute deep dive

If you have more time, here's what's worth looking at:

### In the code

| File | Why it matters |
|---|---|
| [`backend/src/routes/deals.ts`](./backend/src/routes/deals.ts) | REST endpoint design, query parameter validation with Zod, Prisma queries |
| [`backend/src/services/sentiment.ts`](./backend/src/services/sentiment.ts) | FinBERT integration scaffold, deterministic scoring fallback, designed for production swap |
| [`backend/src/middleware/auth.ts`](./backend/src/middleware/auth.ts) | JWT verification middleware, single point of auth |
| [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma) | Full data model — `User`, `Deal`, `Investment`, `Distribution` |
| [`backend/prisma/seed.ts`](./backend/prisma/seed.ts) | 10 realistic mock deals with FinBERT-style sentiment scoring |
| [`frontend/src/lib/forecast.ts`](./frontend/src/lib/forecast.ts) | TFT-inspired distribution forecast — heavily commented |
| [`frontend/src/components/ForecastChart.tsx`](./frontend/src/components/ForecastChart.tsx) | Recharts stacked area chart with custom tooltip |
| [`frontend/src/components/SentimentWidget.tsx`](./frontend/src/components/SentimentWidget.tsx) | FinBERT widget with confidence bar and signal list |
| [`frontend/src/styles/brand.css`](./frontend/src/styles/brand.css) | Editorial Forest + Brass design tokens |

### In the docs
- [`ML_FEATURES.md`](./ML_FEATURES.md) — full FinBERT + TFT architecture rationale
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system topology and design decisions
- [`INTERACTIONS.md`](./INTERACTIONS.md) — exhaustive list of every interactive element
- [`COMPETITORS.md`](./COMPETITORS.md) — research on Yeldo and competitors (Walliance, EstateGuru, CrowdStreet, CapitalRise)
- [`BRAND_TOKENS.md`](./BRAND_TOKENS.md) — design system rationale

---

## What I'd want you to take away

If you only spend 5 minutes here, the three things I'd want you to notice:

1. **The product thinking matches Yeldo's actual business.** This isn't a generic todo app dressed up — every screen mirrors how a real European private-debt platform works. The instrument types, the LTV display, the quarterly-vs-at-maturity distribution toggle, the "Reserved to Professional Investors" badge, the FinSA Art. 4-5 disclaimer — these are all real Yeldo-specific patterns I noticed and replicated.

2. **The code is junior-honest, not over-engineered.** I built this in 5 months of self-taught full-stack work via Cursor and Claude. The architecture is clean but you'll see places where I chose pragmatism over patterns (e.g., simple JWT auth instead of refresh tokens, deterministic seed scoring instead of a live ML server). I've documented those trade-offs in [`ARCHITECTURE.md`](./ARCHITECTURE.md) — every shortcut has a "production migration path" note.

3. **The ML features cite real papers.** Almost no junior portfolio piece includes ML features that link to actual high-cited research. The FinBERT and TFT integrations are real differentiators — and they're features I'd genuinely advocate Yeldo build into the platform itself.

---

## Want to talk?

If anything here is interesting or you'd like to dig in further: [ferdinand.straehuber@gmail.com](mailto:ferdinand.straehuber@gmail.com) · [LinkedIn](https://linkedin.com/in/ferdinand-straehuber) · [vecterai.tech](https://vecterai.tech)
