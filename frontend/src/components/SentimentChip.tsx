import type { SentimentLabel } from '../types/deal';

const STYLES: Record<SentimentLabel, { bg: string; text: string; dot: string }> = {
  bullish: {
    bg: 'bg-[rgba(74,124,58,0.15)]',
    text: 'text-text-success',
    dot: 'bg-text-success',
  },
  neutral: {
    bg: 'bg-soft',
    text: 'text-text-secondary',
    dot: 'bg-text-secondary',
  },
  cautious: {
    bg: 'bg-[rgba(180,83,9,0.15)]',
    text: 'text-text-warning',
    dot: 'bg-text-warning',
  },
};

export function SentimentChip({ label, score }: { label: SentimentLabel; score: number }) {
  const s = STYLES[label];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${s.bg} ${s.text}`}
      aria-label={`FinBERT sentiment ${label} confidence ${Math.round(score * 100)} percent`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label.toUpperCase()} {Math.round(score * 100)}%
    </span>
  );
}
