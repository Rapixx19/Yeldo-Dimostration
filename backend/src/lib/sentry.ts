import * as Sentry from '@sentry/node';

/**
 * Backend Sentry init.
 *
 * Conditional on SENTRY_DSN. When unset (local dev, CI, or any
 * environment where you haven't wired up Sentry yet) the init
 * silently no-ops. No errors get sent, no SDK warning is logged.
 *
 * When set (production via Railway env), unhandled errors from
 * route handlers and the express errorHandler middleware get
 * captured with full request context — URL, method, status,
 * stack — minus the PII that Sentry's default scrubbers strip.
 *
 * What we do NOT capture
 * ----------------------
 * - Request bodies (could contain investment amounts or other data)
 * - Full user objects (we only attach userId for correlation)
 * - Headers (Authorization especially)
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'production',
    release: process.env.npm_package_version,
    // Light tracing — 10% of transactions sampled. Adjust if traffic
    // grows; for the demo's volume this is fine.
    tracesSampleRate: 0.1,
    // Disable PII auto-attach. We attach what we want manually
    // (userId on requests) via Sentry.setUser in route middleware.
    sendDefaultPii: false,
  });

  return true;
}

export { Sentry };
