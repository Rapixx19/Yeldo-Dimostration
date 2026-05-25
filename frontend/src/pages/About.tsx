import { useState } from 'react';
import { MLInfoModal } from '../components/MLInfoModal';

export function About() {
  const [modal, setModal] = useState<'finbert' | 'tft' | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-3">
        ML methodology
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-brand-dark mb-4">
        How the ML features work
      </h1>
      <p className="text-text-secondary leading-relaxed mb-8">
        The deal tracker ships with two ML-flavoured features. Both cite the source paper, both
        document a drop-in production migration path, and both currently use deterministic logic so
        the demo runs with zero ML infra cost.
      </p>

      <section className="bg-card border border-border-light rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-lg font-medium text-brand-dark">FinBERT — sentiment</h2>
          <button
            onClick={() => setModal('finbert')}
            className="text-[11px] font-medium text-brand-accent hover:underline"
          >
            What is it? →
          </button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          A 3-class classifier (positive / neutral / negative) trained on financial text. The demo
          reproduces what FinBERT would output for each deal&apos;s KPIs and surfaces the contributing
          signals as plain-English bullets. See{' '}
          <code className="text-brand-accent">backend/src/services/sentiment.ts</code> for the
          documented swap-in path to HuggingFace ProsusAI/finbert.
        </p>
        <a
          href="https://arxiv.org/abs/1908.10063"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-accent hover:underline"
        >
          arXiv:1908.10063 ↗
        </a>
      </section>

      <section className="bg-card border border-border-light rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-lg font-medium text-brand-dark">TFT — multi-horizon forecasting</h2>
          <button
            onClick={() => setModal('tft')}
            className="text-[11px] font-medium text-brand-accent hover:underline"
          >
            What is it? →
          </button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          Temporal Fusion Transformer for explainable time-series forecasts. The demo renders a
          deterministic version of the same shape — stacked area chart with per-investment layers.
          Implementation lives in{' '}
          <code className="text-brand-accent">frontend/src/lib/forecast.ts</code> (coming in Phase
          4).
        </p>
        <a
          href="https://arxiv.org/abs/1912.09363"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-accent hover:underline"
        >
          arXiv:1912.09363 ↗
        </a>
      </section>

      <section className="text-sm text-text-secondary leading-relaxed">
        <h3 className="text-base font-medium text-brand-dark mb-2">Design philosophy</h3>
        <p>
          ML in a portfolio piece should be honest. Deterministic doesn&apos;t mean fake — it means
          reproducible, fast, and defensible. Every signal explains itself. The production swap is
          documented inline so the path from demo to real model is obvious.
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
