# Competitor research

Research conducted before building, to identify which UX patterns to adopt, which differentiate the build, and what's standard table-stakes for European private-debt platforms.

---

## Yeldo (primary target)

**URL:** [yeldo.com](https://www.yeldo.com) · App at [app.yeldo.com](https://app.yeldo.com)
**Founded:** 2018 · **HQ:** Lugano, Switzerland (also Berlin, Milan)
**Stack signals:** Next.js frontend (visible via Vercel-style image optimization URLs), Azure Blob Storage for assets

### Their actual platform features
- **4-step journey:** Subscribe → Discover → Stay tuned → Monitor
- **Professional-investor only** (FinSA Art. 4-5 in Switzerland, WpIG tied agent in Germany)
- **Deal types:** Senior Loan, Mezzanine Loan, Senior Debt, Secured Mezzanine Loan
- **Geographies:** Italy, Switzerland, Spain, Portugal primarily
- **Track record:** ~€1.8 Bn transacted, ~70 deals, ~13.5% historical IRR, 30 exited
- **Liquidity:** Secondary market windows (unique differentiator)
- **Collateral:** Always asset-backed, first-lien mortgages

### What I mimicked from Yeldo
- 4-step journey reflected in nav (Discover → Portfolio → Dashboard → Updates)
- Deal card structure: country flag + instrument badge + maturity / LTV / distribution / raised
- Professional investor positioning with FinSA disclaimer
- Real case-study deals as seed data (Mas d'en Bruno, Rovello 14, Varedo, Louis-Casaï)

### What I deliberately differentiated
- **Palette** — Editorial Forest + Brass vs. their cleaner neutral cream
- **ML features** — neither FinBERT nor TFT exists in Yeldo's public platform
- **One-click demo** — Yeldo requires full KYC; mine has a recruiter shortcut

---

## Walliance

**URL:** [walliance.eu](https://walliance.eu)
**Founded:** 2017 · **HQ:** Trento, Italy
**Stack:** Custom (PHP backend visible from headers, React-like SPA frontend)

### Their model
- Equity-based real estate crowdfunding (different from Yeldo's debt focus)
- Lower minimum tickets (€500-€1,000 vs. Yeldo's €100K)
- Mass-market vs. Yeldo's professional-investor focus
- Geographic focus: Italy, Spain

### Why they're not a direct match for my build
Different product category (equity, not debt). Useful for UX reference (deal cards, filter chips) but not for the financial model.

---

## EstateGuru

**URL:** [estateguru.co](https://estateguru.co)
**Founded:** 2014 · **HQ:** Tallinn, Estonia
**Stack:** Modern React-based platform with TypeScript signals

### Their model
- Loan-based real estate crowdfunding across the Baltics, Germany, Spain
- ~€1 Bn+ funded
- Auto-invest feature (algorithmic deployment of capital across deals matching investor profile)
- Secondary market for resale

### Pattern I borrowed
- **Auto-invest concept** maps directly to the profile-matching feature I deferred to v3
- Their portfolio dashboard with maturity progress bars influenced the v1 design

---

## CrowdStreet

**URL:** [crowdstreet.com](https://crowdstreet.com)
**Founded:** 2014 · **HQ:** Portland, US
**Stack:** Modern React-based, AWS infrastructure

### Their model
- US-focused commercial real estate crowdfunding
- Both equity and debt instruments
- $4B+ total invested across their lifetime
- Heavy regulatory focus (SEC Reg A+, Reg D)

### Pattern I borrowed
- **Deal detail tabbed interface** (Overview / Financials / Sponsor / Risks / Documents) is now industry-standard, originated from CrowdStreet's design language
- Sponsor-card pattern with track record on every deal

---

## CapitalRise

**URL:** [capitalrise.com](https://capitalrise.com)
**Founded:** 2016 · **HQ:** London, UK
**Stack:** Custom Ruby/Rails-style backend, React frontend

### Their model
- UK prime residential property loans
- Minimum £1,000
- IFISA-eligible (tax-advantaged)
- Strong focus on London prime market

### Pattern I borrowed
- Their **stats bar** (Total funded / Avg yield / Repaid) inspired the discover page header stats
- "Reserved to Professional Investors" copy treatment

---

## Common patterns across all five

All 5 platforms share these patterns — I included them in the build as **table stakes**:
- Separated frontend / backend architecture
- REST API with JWT auth
- PostgreSQL or equivalent relational DB
- Country flags on deal cards
- Stats / track-record headline bar
- Deal detail with tabbed content
- Sticky invest sidebar
- Portfolio dashboard with IRR + allocation
- Maturity progress visualization
- Professional investor disclaimer

## Differentiators in this build

Things **none** of the 5 platforms publicly offer that I included:
- **FinBERT sentiment analysis** with arXiv citation
- **TFT-inspired multi-horizon forecast** with arXiv citation
- **In-app educational ML tooltips** linking to research papers
- **One-click recruiter demo access** (specific to this being a portfolio piece)

The first two are real product features I'd advocate Yeldo add. The annotated code shows how I'd build them for production.

---

## Source materials used during research

- Yeldo's public site (yeldo.com), deal-by-deal page, 2025 Performance Report
- Walliance's deals page (walliance.eu/projects)
- EstateGuru's marketing site and demo platform tour
- CrowdStreet's investor academy content
- CapitalRise's IFISA marketing materials
- *PitchBook* private debt category overview (general industry benchmarks)
