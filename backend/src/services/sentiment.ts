/**
 * FINBERT SENTIMENT SCORING
 * ========================================================================
 *
 * RESEARCH BASIS:
 *   Araci, D. (2019). FinBERT: Financial Sentiment Analysis with Pre-trained
 *   Language Models. arXiv:1908.10063
 *   https://arxiv.org/abs/1908.10063
 *
 * WHY THIS MATTERS:
 *   General NLP models (plain BERT, GPT) fail on financial text because finance
 *   has its own vocabulary. "Yield", "haircut", "covenant breach", "mezzanine",
 *   "drawdown" mean different things in finance vs. everyday English. FinBERT
 *   solves this by fine-tuning BERT on financial corpora (Reuters, Financial
 *   PhraseBank), producing a 3-class classifier:
 *     - positive (bullish)
 *     - neutral
 *     - negative (cautious)
 *
 *   In production, you'd feed deal description text + sponsor materials + memo
 *   into a FinBERT inference endpoint and get back a label + confidence score.
 *
 * CURRENT IMPLEMENTATION:
 *   This module computes sentiment DETERMINISTICALLY from each deal's KPIs.
 *   The scoring rules were designed to mirror what a fine-tuned FinBERT
 *   classifier would output for the same deal description. This is the right
 *   choice for a demo/portfolio piece because:
 *     1. No live ML server required (zero infra cost)
 *     2. Deterministic — same inputs always produce same output, useful in tests
 *     3. Fast — synchronous, no network latency
 *     4. Defensible — every signal has a clear "why this drives sentiment"
 *
 * PRODUCTION MIGRATION PATH (drop-in replacement):
 *   To swap in real FinBERT:
 *     1. Provision a HuggingFace Inference API endpoint for FinBERT-tone, OR
 *        deploy ProsusAI/finbert on a GPU instance (G4dn on AWS is ~$50/mo)
 *     2. Replace the body of computeSentiment() below with:
 *
 *          const text = `${deal.description} Sponsor: ${deal.sponsorName} (${deal.sponsorDescription})`;
 *          const response = await fetch('https://api-inference.huggingface.co/models/ProsusAI/finbert', {
 *            method: 'POST',
 *            headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` },
 *            body: JSON.stringify({ inputs: text }),
 *          });
 *          const result = await response.json();
 *          // result is [[ {label: "positive"|"neutral"|"negative", score: 0.xxx}, ... ]]
 *
 *     3. The return shape stays IDENTICAL — no UI, schema, or API changes
 *
 *     4. The signal generation logic below can be retained as an
 *        "explainability layer" — show users WHY the model said what it said
 *
 * ========================================================================
 */

import type { Instrument } from '@prisma/client';

export type SentimentLabel = 'bullish' | 'neutral' | 'cautious';

export interface Signal {
  text: string;
  polarity: 'positive' | 'negative';
}

export interface SentimentResult {
  label: SentimentLabel;
  score: number; // 0.0 – 1.0 (confidence)
  signals: Signal[];
}

interface DealKPIs {
  loanToValue: number;
  instrument: Instrument;
  maturityMonths: number;
  hasFirstLienMortgage: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Coefficients
// ─────────────────────────────────────────────────────────────────────
// SIGNAL_WEIGHTS bundles the magnitudes that drive each signal's contribution
// to the score. Exposed at the top of the file so the algorithm is transparent.
// The natural maximum is BASE + LTV_MAX + senior_loan + LIEN ≈ 0.90, so scores
// spread between ~0.27 and ~0.90 — no saturation at 1.00 as in the previous
// boolean-flag implementation.
const BASE = 0.5;
const LTV_PIVOT = 50;          // LTV at this value contributes 0 (neutral)
const LTV_SLOPE = 0.005;       // adjustment per LTV percentage point away from pivot
const LTV_MIN = -0.12;
const LTV_MAX = 0.18;
const MAT_PIVOT = 24;          // maturity in months that contributes 0
const MAT_SLOPE = 0.003;       // adjustment per month away from pivot
const MAT_MIN = -0.1;
const MAT_MAX = 0.08;
const INSTRUMENT_ADJ: Record<string, number> = {
  senior_loan: 0.1,
  secured_mezzanine: 0.05,
  mezzanine: -0.05,
};
const LIEN_ADJ = 0.12;
const BULLISH_THRESHOLD = 0.7;
const CAUTIOUS_THRESHOLD = 0.4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeSentiment(deal: DealKPIs): SentimentResult {
  const signals: Signal[] = [];
  let score = BASE;

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 1: Loan-to-value — continuous (linear away from pivot, clamped)
  // ─────────────────────────────────────────────────────────────────────
  const ltvAdj = clamp((LTV_PIVOT - deal.loanToValue) * LTV_SLOPE, LTV_MIN, LTV_MAX);
  score += ltvAdj;
  if (deal.loanToValue <= 40) {
    signals.push({
      text: `Low LTV at ${deal.loanToValue}% provides strong asset coverage`,
      polarity: 'positive',
    });
  } else if (deal.loanToValue >= 60) {
    signals.push({
      text: `Elevated LTV at ${deal.loanToValue}% increases downside risk`,
      polarity: 'negative',
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 2: Instrument seniority — categorical, tiered
  // ─────────────────────────────────────────────────────────────────────
  const instrumentAdj = INSTRUMENT_ADJ[deal.instrument] ?? 0;
  score += instrumentAdj;
  if (deal.instrument === 'senior_loan') {
    signals.push({ text: 'Senior position in capital structure', polarity: 'positive' });
  } else if (deal.instrument === 'secured_mezzanine') {
    signals.push({ text: 'Secured mezzanine with collateral protection', polarity: 'positive' });
  } else if (deal.instrument === 'mezzanine') {
    signals.push({ text: 'Mezzanine position subordinated to senior debt', polarity: 'negative' });
  }

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 3: Maturity exposure — continuous (linear away from pivot)
  // ─────────────────────────────────────────────────────────────────────
  const maturityAdj = clamp((MAT_PIVOT - deal.maturityMonths) * MAT_SLOPE, MAT_MIN, MAT_MAX);
  score += maturityAdj;
  if (deal.maturityMonths >= 48) {
    signals.push({
      text: `${deal.maturityMonths}-month maturity exposes to macro volatility`,
      polarity: 'negative',
    });
  } else if (deal.maturityMonths <= 18) {
    signals.push({
      text: `Short ${deal.maturityMonths}-month maturity reduces duration risk`,
      polarity: 'positive',
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 4: First-lien mortgage — boolean
  // ─────────────────────────────────────────────────────────────────────
  if (deal.hasFirstLienMortgage) {
    signals.push({
      text: 'First-lien mortgage collateral mitigates downside risk',
      polarity: 'positive',
    });
    score += LIEN_ADJ;
  }

  // ─────────────────────────────────────────────────────────────────────
  // CLAMP & LABEL
  // ─────────────────────────────────────────────────────────────────────
  score = clamp(score, 0, 1);

  let label: SentimentLabel;
  if (score >= BULLISH_THRESHOLD) label = 'bullish';
  else if (score <= CAUTIOUS_THRESHOLD) label = 'cautious';
  else label = 'neutral';

  return { label, score: parseFloat(score.toFixed(2)), signals };
}
