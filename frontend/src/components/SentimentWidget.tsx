import { useState } from 'react';
import type { Deal, SentimentLabel } from '../types/deal';
import { MLInfoModal } from './MLInfoModal';

const LABEL_STYLES: Record<SentimentLabel, { text: string; bar: string }> = {
  bullish: { text: 'text-text-success', bar: 'bg-text-success' },
  neutral: { text: 'text-text-secondary', bar: 'bg-text-secondary' },
  cautious: { text: 'text-text-warning', bar: 'bg-text-warning' },
};

export function SentimentWidget({ deal }: { deal: Deal }) {
  const [modalOpen, setModalOpen] = useState(false);
  const style = LABEL_STYLES[deal.sentimentLabel];

  return (
    <>
      <section
        aria-label="FinBERT sentiment analysis"
        className="bg-soft rounded-lg p-5 mb-6 border border-[rgba(168,116,50,0.2)]"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
            <span className="w-6 h-6 rounded-md bg-brand-dark text-page flex items-center justify-center text-[10px] font-medium">
              AI
            </span>
            Sentiment analysis
          </div>
          <button
            onMouseEnter={() => setModalOpen(true)}
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(168,116,50,0.12)] text-brand-accent text-[10px] font-medium hover:bg-[rgba(168,116,50,0.2)]"
            aria-label="What is FinBERT?"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            FinBERT-powered
          </button>
        </div>

        <div className="flex items-center gap-4 mb-3.5 pb-3.5 border-b border-border-light">
          <div className={`text-lg font-medium ${style.text} tracking-wide`}>
            ● {deal.sentimentLabel.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[11px] text-text-secondary mb-1">
              <span>Confidence</span>
              <span className={`${style.text} font-medium`}>
                {Math.round(deal.sentimentScore * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
              <div
                className={`${style.bar} h-full`}
                style={{ width: `${deal.sentimentScore * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] text-text-secondary uppercase tracking-wide mb-2">
          Key signals detected
        </div>
        {deal.sentimentSignals.map((sig, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5 text-sm text-text-primary">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                sig.polarity === 'positive'
                  ? 'bg-[rgba(74,124,58,0.2)] text-text-success'
                  : 'bg-[rgba(180,83,9,0.2)] text-text-warning'
              }`}
            >
              {sig.polarity === 'positive' ? '+' : '−'}
            </span>
            <span>{sig.text}</span>
          </div>
        ))}

        <div className="border-t border-border-light pt-3 mt-3 text-[11px] text-text-tertiary italic leading-relaxed">
          Sentiment classified by a FinBERT-inspired pipeline (Araci, 2019) —{' '}
          <a
            href="https://arxiv.org/abs/1908.10063"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-accent hover:underline not-italic"
          >
            arXiv:1908.10063
          </a>
          . Three-class classifier (positive / neutral / negative) trained on financial corpora.
        </div>
      </section>

      <MLInfoModal type="finbert" open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
