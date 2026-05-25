import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { to: '/discover', label: 'Discover' },
  { to: '/portfolio', label: 'Portfolio', authRequired: true },
  { to: '/dashboard', label: 'Dashboard', authRequired: true },
  { to: '/about', label: 'About' },
];

export function Layout() {
  const { user, token, logout } = useAuth();
  const nav = useNavigate();

  async function handleLogout() {
    await logout();
    nav('/');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-light bg-page">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-medium tracking-tight text-brand-dark">
            <span className="w-7 h-7 rounded-md bg-brand-dark text-page flex items-center justify-center text-sm">
              Y
            </span>
            Yeldo
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {NAV_LINKS.filter((l) => !l.authRequired || token).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md transition ${
                    isActive
                      ? 'bg-soft text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="text-sm flex items-center gap-2">
            {user ? (
              <>
                <span className="text-text-secondary text-xs hidden sm:inline">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/signup"
                  className="px-3 py-1.5 rounded-md bg-brand-dark text-page hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border-light text-[11px] text-text-tertiary">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <div>© 2026 Yeldo Deal Tracker — portfolio demo. Virtual investments only.</div>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-text-primary">
              ML methodology
            </Link>
            <a
              href="https://github.com/Rapixx19/Yeldo-Dimostration"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
