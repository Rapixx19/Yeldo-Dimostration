import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';

// Heavy pages are lazy-loaded so the landing page doesn't pay for Recharts.
const Discover = lazy(() => import('./pages/Discover').then((m) => ({ default: m.Discover })));
const DealDetailPage = lazy(() =>
  import('./pages/DealDetailPage').then((m) => ({ default: m.DealDetailPage })),
);
const Portfolio = lazy(() =>
  import('./pages/Portfolio').then((m) => ({ default: m.Portfolio })),
);
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));

function PageFallback() {
  return <div className="py-16 text-center text-text-secondary">Loading…</div>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route
              path="/discover"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Discover />
                </Suspense>
              }
            />
            <Route
              path="/deals/:slug"
              element={
                <Suspense fallback={<PageFallback />}>
                  <DealDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageFallback />}>
                    <Portfolio />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageFallback />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <Suspense fallback={<PageFallback />}>
                  <About />
                </Suspense>
              }
            />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
