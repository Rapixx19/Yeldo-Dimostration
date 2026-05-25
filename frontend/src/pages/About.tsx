import { useState } from 'react';
import { MLInfoModal } from '../components/MLInfoModal';

function StackRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border-light last:border-b-0">
      <td className="py-2.5 pr-4 text-text-secondary text-xs uppercase tracking-wide w-28">
        {label}
      </td>
      <td className="py-2.5 text-text-primary">{value}</td>
    </tr>
  );
}

export function About() {
  const [modal, setModal] = useState<'finbert' | 'tft' | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-3">
        About this build
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-brand-dark mb-4">
        How it&apos;s wired
      </h1>
      <p className="text-text-secondary leading-relaxed mb-10">
        Yeldo Deal Tracker is a fullstack portfolio piece for the Yeldo Junior Fullstack
        Developer application. Built with React, Express, PostgreSQL, and two ML features
        citing real research.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-medium text-brand-dark mb-3">Architecture</h2>
        <pre className="bg-soft text-text-primary text-[11px] leading-snug rounded-lg p-4 overflow-x-auto whitespace-pre">
{`Browser
  │
  ▼
Vercel (Vite SPA, React 18 + Tailwind)
  │  JWT in localStorage
  ▼
Railway (Express + Prisma)  ─── PostgreSQL (Supabase, EU region)
  │
  ├── /api/auth   (JWT + bcrypt, demo-login one-click)
  ├── /api/deals  (filters, public)
  ├── /api/investments + /api/portfolio  (auth-gated)
  └── services/sentiment.ts   ← FinBERT-inspired scoring
`}
        </pre>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-medium text-brand-dark mb-3">Tech stack</h2>
        <table className="w-full text-sm">
          <tbody>
            <StackRow label="Frontend" value="React 18 + TypeScript + Vite + Tailwind + Recharts" />
            <StackRow label="Backend" value="Node 20 + Express + TypeScript + Prisma" />
            <StackRow label="Database" value="PostgreSQL (Supabase, EU region)" />
            <StackRow label="Auth" value="Custom JWT + bcrypt" />
            <StackRow label="Deploy" value="Vercel (frontend) + Railway (backend)" />
            <StackRow label="ML" value="Deterministic scoring + arXiv-cited migration paths" />
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-medium text-brand-dark mb-3">ML features</h2>

        <div className="bg-card border border-border-light rounded-lg p-5 mb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-medium text-text-primary">FinBERT — sentiment</h3>
            <button
              onClick={() => setModal('finbert')}
              className="text-[11px] font-medium text-brand-accent hover:underline"
            >
              What is it? →
            </button>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Each deal gets a BULLISH / NEUTRAL / CAUTIOUS classification with a confidence
            score, computed from key signals (LTV, instrument seniority, maturity, collateral).
            Drop-in path to HuggingFace ProsusAI/finbert is documented in{' '}
            <code className="text-brand-accent">backend/src/services/sentiment.ts</code>.
          </p>
          <a
            href="https://arxiv.org/abs/1908.10063"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-accent hover:underline"
          >
            arXiv:1908.10063 — Araci, 2019 ↗
          </a>
        </div>

        <div className="bg-card border border-border-light rounded-lg p-5 mb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-medium text-text-primary">TFT — multi-horizon forecast</h3>
            <button
              onClick={() => setModal('tft')}
              className="text-[11px] font-medium text-brand-accent hover:underline"
            >
              What is it? →
            </button>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            A 36-month projected cash distribution chart, stacked by deal, with dashed
            markers at each maturity date. The architecture mirrors TFT&apos;s static
            covariates + known future inputs + historical time series partitioning — see{' '}
            <code className="text-brand-accent">frontend/src/lib/forecast.ts</code>.
          </p>
          <a
            href="https://arxiv.org/abs/1912.09363"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-accent hover:underline"
          >
            arXiv:1912.09363 — Lim et al., 2020 ↗
          </a>
        </div>

        <p className="text-xs text-text-tertiary leading-relaxed">
          Both features ship with deterministic logic for v1, and the migration path to real
          ML inference endpoints is documented inline. See <code>ML_FEATURES.md</code> for
          the full design.
        </p>
      </section>

      <section className="mb-2">
        <h2 className="text-xl font-medium text-brand-dark mb-3">Builder</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          <strong className="text-text-primary font-medium">Ferdinand Strähuber</strong> —
          finance student (MTGA at IE Madrid), founder of{' '}
          <a
            href="https://vecterai.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-accent hover:underline"
          >
            VecterAI
          </a>
          , based in Lugano. Five months of self-taught fullstack work via Cursor + Claude.
        </p>
        <p className="text-sm mt-3">
          <a
            href="https://linkedin.com/in/ferdinand-straehuber"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-accent hover:underline"
          >
            LinkedIn
          </a>
          <span className="text-text-tertiary mx-2">·</span>
          <a
            href="mailto:ferdinand.straehuber@gmail.com"
            className="text-brand-accent hover:underline"
          >
            Email
          </a>
          <span className="text-text-tertiary mx-2">·</span>
          <a
            href="https://github.com/Rapixx19/Yeldo-Dimostration"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-accent hover:underline"
          >
            GitHub
          </a>
        </p>
      </section>

      <MLInfoModal
        type={modal ?? 'finbert'}
        open={modal !== null}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
