import { describe, expect, it } from 'vitest';
import { computeSentiment } from '../../src/services/sentiment.js';

/**
 * sentiment.ts is a pure function — no Prisma, no I/O. Tests assert math
 * directly. Each test exercises one branch of the algorithm so a failure
 * tells you exactly which weight or threshold drifted.
 */

describe('computeSentiment', () => {
  describe('label thresholds', () => {
    it('returns bullish for low-LTV senior-loan first-lien short-maturity', () => {
      // Strong signals: base 0.50 + LTV adj (~+0.075 at 35%)
      // + senior_loan (+0.10) + maturity adj (~+0.024 at 16mo) + lien (+0.12)
      // ≈ 0.82 → bullish
      const result = computeSentiment({
        loanToValue: 35,
        instrument: 'senior_loan',
        maturityMonths: 16,
        hasFirstLienMortgage: true,
      });
      expect(result.label).toBe('bullish');
      expect(result.score).toBeGreaterThanOrEqual(0.7);
    });

    it('returns cautious for high-LTV mezzanine no-lien', () => {
      // base 0.50 + LTV adj (-0.055 at 61%) + mezz (-0.05)
      // + maturity adj (-0.018 at 30mo) + no lien (0)
      // ≈ 0.38 → cautious
      const result = computeSentiment({
        loanToValue: 61,
        instrument: 'mezzanine',
        maturityMonths: 30,
        hasFirstLienMortgage: false,
      });
      expect(result.label).toBe('cautious');
      expect(result.score).toBeLessThanOrEqual(0.4);
    });

    it('returns neutral when score lands between thresholds', () => {
      // Middling deal: base 0.50 + LTV adj (~+0.045 at 41%) + senior_debt (0)
      // + maturity adj (+0.018 at 18mo) + lien (+0.12) ≈ 0.68 → just below bullish
      const result = computeSentiment({
        loanToValue: 41,
        instrument: 'senior_debt',
        maturityMonths: 18,
        hasFirstLienMortgage: true,
      });
      expect(result.label).toBe('neutral');
      expect(result.score).toBeGreaterThan(0.4);
      expect(result.score).toBeLessThan(0.7);
    });
  });

  describe('continuous scoring (no boolean saturation)', () => {
    it('LTV scoring is monotonic — 35% scores strictly higher than 41% scores strictly higher than 55%', () => {
      const a = computeSentiment({
        loanToValue: 35,
        instrument: 'senior_loan',
        maturityMonths: 24,
        hasFirstLienMortgage: true,
      });
      const b = computeSentiment({
        loanToValue: 41,
        instrument: 'senior_loan',
        maturityMonths: 24,
        hasFirstLienMortgage: true,
      });
      const c = computeSentiment({
        loanToValue: 55,
        instrument: 'senior_loan',
        maturityMonths: 24,
        hasFirstLienMortgage: true,
      });
      // This is the property that boolean flags violated: 35% and 41% used to
      // both score +0.18 because both qualified for the "LTV ≤ 40%" branch.
      expect(a.score).toBeGreaterThan(b.score);
      expect(b.score).toBeGreaterThan(c.score);
    });

    it('maturity scoring is monotonic — 12mo scores strictly higher than 36mo (else equal)', () => {
      const a = computeSentiment({
        loanToValue: 40,
        instrument: 'senior_loan',
        maturityMonths: 12,
        hasFirstLienMortgage: true,
      });
      const b = computeSentiment({
        loanToValue: 40,
        instrument: 'senior_loan',
        maturityMonths: 36,
        hasFirstLienMortgage: true,
      });
      expect(a.score).toBeGreaterThan(b.score);
    });

    it('no two distinct realistic deals collide at exactly 1.00', () => {
      // Regression test for the "everything saturates at 100%" bug that
      // motivated the rewrite. With continuous LTV and maturity scoring,
      // it should be very hard to land at exactly 1.00.
      const a = computeSentiment({
        loanToValue: 35,
        instrument: 'senior_loan',
        maturityMonths: 24,
        hasFirstLienMortgage: true,
      });
      const b = computeSentiment({
        loanToValue: 38,
        instrument: 'senior_loan',
        maturityMonths: 36,
        hasFirstLienMortgage: true,
      });
      expect(a.score).toBeLessThan(1.0);
      expect(b.score).toBeLessThan(1.0);
      expect(a.score).not.toBe(b.score);
    });
  });

  describe('instrument tier ordering', () => {
    const base = {
      loanToValue: 50,
      maturityMonths: 24,
      hasFirstLienMortgage: false,
    } as const;

    it('senior_loan > secured_mezzanine > senior_debt > mezzanine for the same KPIs', () => {
      const senior = computeSentiment({ ...base, instrument: 'senior_loan' });
      const securedMezz = computeSentiment({ ...base, instrument: 'secured_mezzanine' });
      const seniorDebt = computeSentiment({ ...base, instrument: 'senior_debt' });
      const mezz = computeSentiment({ ...base, instrument: 'mezzanine' });
      expect(senior.score).toBeGreaterThan(securedMezz.score);
      expect(securedMezz.score).toBeGreaterThan(seniorDebt.score);
      expect(seniorDebt.score).toBeGreaterThan(mezz.score);
    });
  });

  describe('signals emission', () => {
    it('emits a positive low-LTV signal when LTV ≤ 40', () => {
      const result = computeSentiment({
        loanToValue: 35,
        instrument: 'senior_loan',
        maturityMonths: 24,
        hasFirstLienMortgage: false,
      });
      const ltvSignal = result.signals.find((s) => s.text.includes('35%'));
      expect(ltvSignal).toBeDefined();
      expect(ltvSignal?.polarity).toBe('positive');
    });

    it('emits a negative elevated-LTV signal when LTV ≥ 60', () => {
      const result = computeSentiment({
        loanToValue: 65,
        instrument: 'senior_loan',
        maturityMonths: 24,
        hasFirstLienMortgage: false,
      });
      const ltvSignal = result.signals.find((s) => s.text.includes('65%'));
      expect(ltvSignal).toBeDefined();
      expect(ltvSignal?.polarity).toBe('negative');
    });

    it('emits no LTV signal in the neutral zone (40 < LTV < 60)', () => {
      const result = computeSentiment({
        loanToValue: 50,
        instrument: 'senior_debt',
        maturityMonths: 24,
        hasFirstLienMortgage: false,
      });
      const ltvSignals = result.signals.filter((s) => /LTV/i.test(s.text));
      expect(ltvSignals).toHaveLength(0);
    });
  });

  describe('score invariants', () => {
    it('always returns a score in [0, 1]', () => {
      // Adversarial inputs that would otherwise push past the bounds
      const lowExtreme = computeSentiment({
        loanToValue: 100,
        instrument: 'mezzanine',
        maturityMonths: 120,
        hasFirstLienMortgage: false,
      });
      const highExtreme = computeSentiment({
        loanToValue: 0,
        instrument: 'senior_loan',
        maturityMonths: 0,
        hasFirstLienMortgage: true,
      });
      expect(lowExtreme.score).toBeGreaterThanOrEqual(0);
      expect(lowExtreme.score).toBeLessThanOrEqual(1);
      expect(highExtreme.score).toBeGreaterThanOrEqual(0);
      expect(highExtreme.score).toBeLessThanOrEqual(1);
    });

    it('returns a score rounded to two decimal places', () => {
      const result = computeSentiment({
        loanToValue: 37,
        instrument: 'senior_loan',
        maturityMonths: 21,
        hasFirstLienMortgage: true,
      });
      // Multiply by 100 — should be an integer (no rounding error past 2dp)
      expect(result.score * 100).toBe(Math.round(result.score * 100));
    });
  });
});
