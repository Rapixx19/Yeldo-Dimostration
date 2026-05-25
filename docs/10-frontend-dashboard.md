# Spec 10 — Frontend dashboard page

**Goal:** Build the `/dashboard` and `/about` pages. In v1, dashboard duplicates portfolio; about contains the ML deep-dive.

**Time:** 45 minutes
**Depends on:** `09-frontend-portfolio`
**Outputs:** Dashboard + About pages

---

## Acceptance criteria

- [ ] `/dashboard` renders the Portfolio component (alias in v1, will diverge in v2)
- [ ] `/about` is publicly accessible (no auth) and contains:
  - Architecture diagram (use the ASCII art from `ARCHITECTURE.md`)
  - Tech stack table (frontend + backend)
  - ML features explanation with arXiv links
  - Builder bio with LinkedIn link

## Files to create

```
frontend/src/
├── pages/Dashboard.tsx     # Currently aliases Portfolio
└── pages/About.tsx
```

## Implementation

### `src/pages/Dashboard.tsx`
```tsx
import { Portfolio } from './Portfolio';

// In v1, Dashboard === Portfolio. In v2, Dashboard will show:
// - Per-deal performance comparison
// - Risk concentration warnings
// - Cash flow vs. plan deviation tracking
export function Dashboard() {
  return <Portfolio />;
}
```

### `src/pages/About.tsx`
```jsx
export function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-medium mb-2 tracking-tight">About this build</h1>
      <p className="text-text-secondary mb-12">
        Yeldo Deal Tracker is a portfolio piece by Ferdinand Straehuber for the Yeldo
        Junior Fullstack Developer application. Built with React, Node.js Express,
        PostgreSQL, and two ML features citing real research papers.
      </p>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">Tech stack</h2>
        <table className="w-full text-sm">
          <tbody>
            <Row label="Frontend" value="React 18 + TypeScript + Vite + Tailwind + Recharts" />
            <Row label="Backend" value="Node.js 20 + Express + TypeScript + Prisma" />
            <Row label="Database" value="PostgreSQL (Supabase EU)" />
            <Row label="Auth" value="Custom JWT + bcrypt" />
            <Row label="Deploy" value="Vercel (frontend) + Railway (backend)" />
          </tbody>
        </table>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4">ML features</h2>

        <div className="bg-soft rounded-lg p-5 mb-4">
          <h3 className="font-medium mb-2">FinBERT — sentiment analysis</h3>
          <p className="text-sm text-text-secondary mb-3 leading-relaxed">
            Each deal gets a BULLISH / NEUTRAL / CAUTIOUS classification with confidence
            score, computed from key signals (LTV, instrument seniority, maturity, collateral).
          </p>
          <a href="https://arxiv.org/abs/1908.10063" target="_blank" rel="noopener" className="text-brand-accent text-sm hover:underline">
            arXiv:1908.10063 — Araci, 2019 →
          </a>
        </div>

        <div className="bg-soft rounded-lg p-5 mb-4">
          <h3 className="font-medium mb-2">TFT — multi-horizon distribution forecast</h3>
          <p className="text-sm text-text-secondary mb-3 leading-relaxed">
            A 36-month projected cash distribution chart on the portfolio dashboard,
            stacked by deal, with markers at each maturity date. Architecture mirrors TFT's
            static covariates + known future inputs + historical time series structure.
          </p>
          <a href="https://arxiv.org/abs/1912.09363" target="_blank" rel="noopener" className="text-brand-accent text-sm hover:underline">
            arXiv:1912.09363 — Lim et al., 2020 →
          </a>
        </div>

        <p className="text-xs text-text-tertiary mt-4">
          Both features are implemented with deterministic financial arithmetic in v1, with
          architecture designed for drop-in replacement by real ML inference endpoints in
          production. See ML_FEATURES.md in the repo for full details.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium mb-4">Builder</h2>
        <p className="text-sm leading-relaxed">
          <strong className="font-medium">Ferdinand Straehuber</strong> — finance student
          (MTGA at IE Madrid), founder of <a href="https://vecterai.tech" className="text-brand-accent hover:underline">VecterAI</a>,
          based in Lugano. Five months of self-taught fullstack work via Cursor + Claude.
        </p>
        <p className="text-sm mt-3">
          <a href="https://linkedin.com/in/ferdinand-straehuber" className="text-brand-accent hover:underline">LinkedIn</a>
          {' · '}
          <a href="mailto:ferdinand.straehuber@gmail.com" className="text-brand-accent hover:underline">Email</a>
        </p>
      </section>
    </div>
  );
}
```

## Cursor prompt

```
Build frontend/src/pages/Dashboard.tsx (which just aliases Portfolio in v1) and frontend/src/pages/About.tsx matching the spec.
About page is publicly accessible — no auth required.
Include the architecture diagram, tech stack table, ML features explanation with arXiv links, and builder bio.
External links open in new tabs (target="_blank" rel="noopener").
```
