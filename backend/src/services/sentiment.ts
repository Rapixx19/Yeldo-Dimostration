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

export function computeSentiment(deal: DealKPIs): SentimentResult {
  const signals: Signal[] = [];
  let score = 0.55; // Start slightly above neutral — most curated deals lean positive

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 1: Loan-to-value (lower = stronger asset coverage = bullish)
  // FinBERT would detect phrases like "low LTV", "well-collateralized",
  // "ample equity cushion" in deal descriptions and assign positive sentiment.
  // ─────────────────────────────────────────────────────────────────────
  if (deal.loanToValue <= 40) {
    signals.push({
      text: `Low LTV at ${deal.loanToValue}% provides strong asset coverage`,
      polarity: 'positive',
    });
    score += 0.18;
  } else if (deal.loanToValue >= 60) {
    signals.push({
      text: `Elevated LTV at ${deal.loanToValue}% increases downside risk`,
      polarity: 'negative',
    });
    score -= 0.12;
  }

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 2: Instrument seniority (senior > secured mezz > mezz > debt position)
  // FinBERT would detect "senior", "first-lien", "priority position" as positive
  // and "mezzanine", "subordinated" as more neutral/cautious.
  // ─────────────────────────────────────────────────────────────────────
  if (deal.instrument === 'senior_loan') {
    signals.push({ text: 'Senior position in capital structure', polarity: 'positive' });
    score += 0.12;
  } else if (deal.instrument === 'secured_mezzanine') {
    signals.push({ text: 'Secured mezzanine with collateral protection', polarity: 'positive' });
    score += 0.06;
  } else if (deal.instrument === 'mezzanine') {
    signals.push({ text: 'Mezzanine position subordinated to senior debt', polarity: 'negative' });
    score -= 0.05;
  }
  // senior_debt is neutral — no signal

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 3: Maturity exposure (longer = more macro risk = cautious)
  // FinBERT would detect "long duration", "extended timeline" as risk indicators.
  // ─────────────────────────────────────────────────────────────────────
  if (deal.maturityMonths >= 48) {
    signals.push({
      text: `${deal.maturityMonths}-month maturity exposes to macro volatility`,
      polarity: 'negative',
    });
    score -= 0.1;
  } else if (deal.maturityMonths <= 18) {
    signals.push({
      text: `Short ${deal.maturityMonths}-month maturity reduces duration risk`,
      polarity: 'positive',
    });
    score += 0.08;
  }

  // ─────────────────────────────────────────────────────────────────────
  // SIGNAL 4: First-lien mortgage (always positive when present)
  // FinBERT would weight "first-lien" and "mortgage collateral" heavily positive.
  // ─────────────────────────────────────────────────────────────────────
  if (deal.hasFirstLienMortgage) {
    signals.push({
      text: 'First-lien mortgage collateral mitigates downside risk',
      polarity: 'positive',
    });
    score += 0.15;
  }

  // ─────────────────────────────────────────────────────────────────────
  // CLAMP & LABEL
  // ─────────────────────────────────────────────────────────────────────
  score = Math.max(0.0, Math.min(1.0, score));

  let label: SentimentLabel;
  if (score >= 0.75) label = 'bullish';
  else if (score <= 0.4) label = 'cautious';
  else label = 'neutral';

  return { label, score: parseFloat(score.toFixed(2)), signals };
}
