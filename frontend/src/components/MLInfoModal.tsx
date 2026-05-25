import { useEffect } from 'react';

interface MLModalContent {
  title: string;
  description: string;
  bulletPoints: string[];
  paperTitle: string;
  paperAuthor: string;
  arxivUrl: string;
  arxivId: string;
  productionNote: string;
}

const FINBERT_CONTENT: MLModalContent = {
  title: 'FinBERT — Sentiment analysis',
  description:
    'A 3-class classifier (positive / neutral / negative) fine-tuned on financial corpora to understand domain-specific vocabulary.',
  bulletPoints: [
    'Detects financial vocabulary that general NLP models miss',
    'Outputs label + confidence score (0–100%)',
    'Generates plain-English signal explanations per deal',
    'Production: swap in HuggingFace ProsusAI/finbert endpoint',
  ],
  paperTitle:
    'FinBERT: Financial Sentiment Analysis with Pre-trained Language Models',
  paperAuthor: 'Araci, D. (2019)',
  arxivUrl: 'https://arxiv.org/abs/1908.10063',
  arxivId: 'arXiv:1908.10063',
  productionNote:
    'Currently using deterministic KPI-based scoring. Swap-in path documented in services/sentiment.ts.',
};

const TFT_CONTENT: MLModalContent = {
  title: 'TFT — Multi-horizon forecasting',
  description:
    'Temporal Fusion Transformer architecture that combines RNN layers, self-attention, and gating to produce interpretable time-series forecasts.',
  bulletPoints: [
    'Handles static covariates (LTV, instrument, geography)',
    'Handles known future inputs (distribution dates, maturity)',
    'Handles historical time series (past distributions)',
    'Outputs forecast + variable importance scores',
  ],
  paperTitle:
    'Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting',
  paperAuthor: 'Lim, B., Arik, S., Loeff, N., Pfister, T. (2020)',
  arxivUrl: 'https://arxiv.org/abs/1912.09363',
  arxivId: 'arXiv:1912.09363',
  productionNote:
    'Currently using deterministic financial arithmetic. Architecture designed for drop-in TFT model replacement.',
};

export function MLInfoModal({
  type,
  open,
  onClose,
}: {
  type: 'finbert' | 'tft';
  open: boolean;
  onClose: () => void;
}) {
  const c = type === 'finbert' ? FINBERT_CONTENT : TFT_CONTENT;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ml-modal-title"
    >
      <div
        className="bg-card rounded-lg max-w-md w-full p-6 border border-border-light shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 id="ml-modal-title" className="text-lg font-medium text-brand-dark">
            {c.title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-tertiary hover:text-text-primary text-xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-4 leading-relaxed">{c.description}</p>

        <ul className="space-y-2 mb-4 text-sm">
          {c.bulletPoints.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-accent">•</span>
              <span className="text-text-secondary">{p}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-border-light pt-4 mb-3 text-xs">
          <div className="font-medium mb-1 text-text-primary">{c.paperTitle}</div>
          <div className="text-text-secondary">{c.paperAuthor}</div>
          <a
            href={c.arxivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-accent hover:underline mt-1 inline-block"
          >
            {c.arxivId} ↗
          </a>
        </div>

        <p className="text-[11px] text-text-tertiary italic">{c.productionNote}</p>
      </div>
    </div>
  );
}
