import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level React error boundary. Catches render-time errors anywhere in
 * the child tree and shows a friendly fallback instead of a white screen.
 *
 * Implemented as a class component because that is the only API React
 * exposes for componentDidCatch — function components cannot do this.
 *
 * The error object itself is intentionally NOT surfaced to the user:
 *   - Avoids leaking stack traces (which can mention internal paths,
 *     env values bundled at build time, etc.) to whoever the recruiter
 *     happens to be.
 *   - Keeps the fallback UI calm; a stack trace is the worst possible
 *     thing to put in front of someone who hit a bug.
 *
 * The error is logged to the browser console so developers see it.
 * When Sentry-style client error logging is wired up (Q5), the
 * componentDidCatch hook here is the one place to forward errors.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Single sink for unhandled render errors. Future: forward to Sentry/etc.
    console.error('[ErrorBoundary] caught render error', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-page px-6">
          <div className="max-w-md text-center">
            <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-3">
              Unexpected error
            </p>
            <h1 className="text-2xl font-medium tracking-tight text-brand-dark mb-3">
              Something broke on this page
            </h1>
            <p className="text-text-secondary text-sm mb-6">
              We&apos;ve logged the error. Try reloading — most one-off render issues
              clear up after a refresh.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-6 py-3 bg-brand-dark text-page rounded-md text-sm font-medium hover:opacity-90"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
