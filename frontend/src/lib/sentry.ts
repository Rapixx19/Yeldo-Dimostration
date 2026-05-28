import * as Sentry from '@sentry/react';

/**
 * Frontend Sentry init.
 *
 * Conditional on VITE_SENTRY_DSN. When unset (local dev, or any
 * environment where you haven't wired up Sentry yet) the init
 * silently no-ops. When set (production via Vercel env), unhandled
 * render errors and unhandled promise rejections are captured.
 *
 * What we do NOT capture
 * ----------------------
 * - User emails or names (Sentry's default scrubbers also handle this)
 * - Auth tokens
 * - Form input values
 */
export function initSentry(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Light tracing — 10% of pageloads + navigations. Bump up if
    // we ever care about Core Web Vitals in Sentry's UI.
    tracesSampleRate: 0.1,
    // Send only what's necessary; default scrubbers handle the
    // common PII patterns.
    sendDefaultPii: false,
  });

  return true;
}

export { Sentry };
