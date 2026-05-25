import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-3">404</p>
      <h1 className="text-3xl font-medium tracking-tight text-brand-dark mb-3">Page not found</h1>
      <p className="text-text-secondary mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 bg-brand-dark text-page rounded-md text-sm font-medium hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
