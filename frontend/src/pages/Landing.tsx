import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { ActivityTicker } from '../components/ActivityTicker';

export function Landing() {
  const nav = useNavigate();
  const { demoLogin } = useAuth();

  async function handleDemoLogin() {
    try {
      await demoLogin();
      toast.success('Signed in as recruiter');
      nav('/discover');
    } catch {
      toast.error('Demo login failed — is the backend running and seeded?');
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <p className="text-[11px] uppercase tracking-widest text-brand-accent mb-3">
        Portfolio build · 2026
      </p>
      <h1 className="text-4xl font-medium tracking-tight mb-4 text-brand-dark">
        Yeldo Deal Tracker
      </h1>
      <p className="text-text-secondary text-lg mb-8 leading-relaxed">
        A fullstack portfolio piece demonstrating production patterns for real-estate
        investment platforms. Built with React, Express, PostgreSQL, and two ML
        features citing real research.
      </p>

      <ActivityTicker />

      <div className="flex flex-col sm:flex-row gap-3 mb-12">
        <button
          onClick={handleDemoLogin}
          className="px-6 py-3 bg-brand-dark text-page rounded-md text-sm font-medium hover:opacity-90"
        >
          Sign in as recruiter →
        </button>
        <Link
          to="/auth/signup"
          className="px-6 py-3 border border-border-light rounded-md text-center text-sm font-medium hover:bg-soft"
        >
          Sign up
        </Link>
        <Link
          to="/discover"
          className="px-6 py-3 text-text-secondary text-sm font-medium hover:text-text-primary text-center"
        >
          Browse public deals
        </Link>
      </div>

      <div className="bg-soft rounded-lg p-6 text-sm">
        <p className="font-medium mb-2 text-text-primary">Why "Sign in as recruiter"?</p>
        <p className="text-text-secondary leading-relaxed">
          One-click access to a pre-populated demo account with 6 mock investments
          across Italy, Switzerland, Spain, and Germany. No signup friction —
          designed to let you explore the full platform in under 5 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
        <div className="bg-card border border-border-light rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-wide text-brand-accent mb-2">
            FinBERT
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            3-class sentiment classifier on every deal, citing
            <a
              href="https://arxiv.org/abs/1908.10063"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent hover:underline"
            >
              {' '}arXiv:1908.10063
            </a>
            . Drop-in path to a real HuggingFace endpoint documented in code.
          </p>
        </div>
        <div className="bg-card border border-border-light rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-wide text-brand-accent mb-2">
            TFT forecast
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Multi-horizon portfolio forecasts in the style of
            <a
              href="https://arxiv.org/abs/1912.09363"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent hover:underline"
            >
              {' '}arXiv:1912.09363
            </a>
            , rendered as a stacked area chart with explainable signal layers.
          </p>
        </div>
      </div>
    </div>
  );
}
