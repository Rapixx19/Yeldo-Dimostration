# Interactive elements reference

Complete catalogue of every interactive element in the live demo, page by page. Use this when reviewing to verify each interaction works as documented.

---

## Landing page (`/`)

| Element | Action | What it does |
|---|---|---|
| *"Sign in as recruiter"* button | Click | Auto-logs in to demo account, redirects to `/discover` |
| *"Sign up"* button | Click | Goes to `/auth/signup` |
| *"Browse public deals"* link | Click | Goes to `/discover` in read-only mode (no invest buttons) |
| Navigation logo | Click | Returns to landing |

---

## Auth pages (`/auth/login`, `/auth/signup`)

| Element | Action | What it does |
|---|---|---|
| Email input | Type | Real-time validation (regex + length) |
| Password input | Type | Real-time validation (min 6 chars), show/hide eye icon |
| *"Sign in"* / *"Sign up"* button | Click | POSTs to `/api/auth/login` or `/api/auth/signup`; on success stores JWT in `localStorage`, redirects to `/discover` |
| *"Use demo account"* button (login only) | Click | Pre-fills `recruiter@yeldo-demo.app` + `demo123`, submits |
| Error toast | Auto-shown | If credentials invalid or email taken |

---

## Discover page (`/discover`)

| Element | Action | What it does |
|---|---|---|
| Stats bar (Transacted, Deals, IRR, Exited) | Read-only | Static display of headline track-record stats |
| *Country* filter chip | Click | Opens dropdown with checkboxes for IT, ES, CH, DE, PT |
| *Asset class* filter chip | Click | Opens dropdown — Hospitality, Residential, Industrial, Vacation |
| *Instrument* filter chip | Click | Opens dropdown — Senior Loan, Mezzanine, Senior Debt, Secured Mezz |
| *Maturity* filter chip | Click | Opens dropdown — <12mo, 12-24mo, 24-36mo, >36mo |
| Active filter chip | Click | Removes that filter |
| Search input | Type | Real-time deal name search |
| Deal card | Click | Navigates to `/deals/[slug]` |
| Deal card | Hover | Subtle elevation + brass border accent |
| *"View deal"* CTA | Click | Same as card click |

**API calls triggered:**
- Initial load: `GET /api/deals`
- Filter change: `GET /api/deals?country=IT&instrument=mezzanine`
- Search: client-side filter on already-loaded deals

---

## Deal detail page (`/deals/:slug`)

### Hero section
| Element | Action | What it does |
|---|---|---|
| Breadcrumb (Discover › Country › Deal) | Click any segment | Navigates back |
| Sentiment chip (BULLISH 87%) | Hover | Tooltip preview of full sentiment widget |
| Sentiment chip | Click | Scrolls to FinBERT widget |

### Tabs
| Tab | Click action | Shows |
|---|---|---|
| Overview | Default | Investment summary + FinBERT + Key terms + Sponsor + Risks |
| Financials | Click | IRR breakdown, distribution schedule table, total return projection |
| Sponsor | Click | Sponsor profile, track record, comparable assets |
| Risks | Click | Detailed risk analysis, severity matrix |
| Updates | Click | Timeline of deal updates (mock 4-6 entries) |
| Documents | Click | List of downloadable PDFs (term sheet, factsheet) |

### FinBERT widget
| Element | Action | What it does |
|---|---|---|
| *"FinBERT-powered"* badge | Hover | Modal opens explaining FinBERT |
| Confidence bar | Read-only | Visual representation of sentiment confidence |
| Signal list | Read-only | Plain-English explanation of score drivers |
| arXiv link | Click | Opens https://arxiv.org/abs/1908.10063 in new tab |

### Sticky invest sidebar
| Element | Action | What it does |
|---|---|---|
| Raised progress bar | Read-only | Shows % raised toward target |
| Amount input | Type | Validates (minimum €100K, max remaining capacity), updates projection live |
| *€100K / €250K / €500K / Max* quick buttons | Click | Sets input to that value |
| Investment summary calc | Live update | Shows expected returns based on IRR |
| *"Invest now"* CTA | Click | POSTs to `/api/investments`, shows loading state, then toast confirmation |
| FinSA disclaimer | Read-only | Legal compliance display |

**API calls triggered:**
- Page load: `GET /api/deals/:slug`
- Invest click: `POST /api/investments` with `{ dealId, amount }`

---

## Portfolio page (`/portfolio`)

### Welcome + total
| Element | Action | What it does |
|---|---|---|
| Welcome message | Read-only | Shows user name from JWT |
| Total portfolio value | Read-only | Sum of all active investment amounts |

### KPI cards
| Card | Computed from |
|---|---|
| Total invested | `SUM(investments.amount)` |
| Weighted IRR | `SUM(amount × irr) / SUM(amount)` |
| Projected returns | `SUM(amount × irr × maturityMonths / 12)` |
| Next distribution | Earliest upcoming distribution from `lib/forecast.ts` |

### TFT forecast chart
| Element | Action | What it does |
|---|---|---|
| *"TFT-inspired model"* badge | Hover | Modal opens explaining TFT |
| Chart area | Hover | Tooltip shows per-deal distribution at that month + total |
| Maturity markers (dashed brass lines) | Read-only | Visual cue for when each deal matures |
| arXiv link in footer | Click | Opens https://arxiv.org/abs/1912.09363 in new tab |
| Legend items | Click | Toggle visibility of that series |

### Country allocation donut
| Element | Action | What it does |
|---|---|---|
| Donut segment | Hover | Tooltip shows country + amount + % |
| Legend item | Click | Toggle that country's visibility |

### Upcoming distributions
| Element | Action | What it does |
|---|---|---|
| Distribution row | Click | Navigates to that deal's detail page |
| Amount (green) | Read-only | Expected distribution amount |

### Active investments table
| Element | Action | What it does |
|---|---|---|
| Deal name | Click | Navigates to deal detail |
| Instrument pill | Click | Filters table to that instrument type |
| Sort headers (Invested, IRR) | Click | Sorts ascending/descending |
| Maturity progress bar | Read-only | Visual progress toward maturity |

**API calls triggered:**
- Page load: `GET /api/investments` (all user's investments with joined deal data)
- No additional calls — chart computations are client-side

---

## Global navigation

| Element | Action | What it does |
|---|---|---|
| Logo (top-left) | Click | Goes to `/discover` if logged in, `/` if not |
| *Discover* nav link | Click | Goes to `/discover` |
| *Portfolio* nav link | Click | Goes to `/portfolio` (auth-protected) |
| *Dashboard* nav link | Click | Goes to `/dashboard` (same as portfolio in v1) |
| *Updates* nav link | Click | Goes to `/updates` — placeholder in v1 |
| User avatar (FS initial) | Click | Opens dropdown with Profile + Sign out |
| *"Sign out"* | Click | Clears JWT, redirects to `/` |

---

## About page (`/about`)

Static page accessible from footer. Contains:
- Architecture diagram (system topology)
- Tech stack rationale (why React, why Express, why custom JWT)
- ML feature explanations (links to arXiv papers)
- Builder bio (links to LinkedIn, GitHub, VecterAI)

---

## Footer (every page)

| Link | Goes to |
|---|---|
| About this build | `/about` |
| GitHub | https://github.com/[username]/yeldo-deal-tracker |
| LinkedIn | https://linkedin.com/in/ferdinand-straehuber |
| VecterAI | https://vecterai.tech |
| Risk disclaimer | `/legal/risk` |

---

## What ISN'T interactive (intentionally)

These are deferred to v2 / v3:
- ❌ Filter persistence in URL params (would need refactor)
- ❌ Real KYC / professional investor profile activation (mock badge only)
- ❌ Document PDF generation (placeholder download)
- ❌ Secondary market / selling positions
- ❌ Profile-based deal recommendations (v3)
- ❌ Real email notifications
- ❌ Real Stripe / payment integration (virtual portfolio only)

Every one of these is documented in the spec backlog as a v2 or v3 candidate.
