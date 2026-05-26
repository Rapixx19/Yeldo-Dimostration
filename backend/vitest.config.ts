import { defineConfig } from 'vitest/config';

/**
 * Backend test config. Notes:
 *
 * - environment 'node' — no DOM; we're testing pure services + (mocked) DB queries
 * - include only tests/ — keeps src/ pristine and CI logs unambiguous
 * - globals: false — match v1 style; tests import { describe, it, expect } explicitly
 * - coverage: v8 provider; reports HTML + text; thresholds are NOT enforced
 *   globally because most of the codebase is untested today. We can tighten
 *   per-file thresholds once coverage builds up.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/services/**/*.ts'],
      exclude: ['src/services/**/*.d.ts'],
    },
  },
});
