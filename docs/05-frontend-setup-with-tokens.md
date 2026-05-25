# Spec 05 — Frontend setup with brand tokens

**Goal:** Install Tailwind, configure brand tokens, set up routing, axios client, and the auth context.

**Time:** 45 minutes
**Depends on:** `00-project-setup`
**Outputs:** Routed frontend shell with brand-tokenized styling

---

## Acceptance criteria

- [ ] Tailwind installed with Editorial Forest + Brass tokens (see `BRAND_TOKENS.md`)
- [ ] React Router with routes: `/`, `/auth/login`, `/auth/signup`, `/discover`, `/deals/:slug`, `/portfolio`, `/dashboard`, `/about`
- [ ] Protected route wrapper redirects unauthenticated users to `/auth/login`
- [ ] Axios client with JWT interceptor automatically attaches token from localStorage
- [ ] AuthContext provides `user`, `token`, `login()`, `logout()`, `signup()`, `demoLogin()`
- [ ] Default Layout component with nav + footer
- [ ] All routes render placeholder content (real pages come in later specs)

## Files to create

```
frontend/src/
├── App.tsx                      # Router + AuthProvider wrapper
├── main.tsx                     # React entry
├── api/client.ts                # Axios with interceptor
├── api/auth.ts                  # Login, signup, demo-login API calls
├── contexts/AuthContext.tsx
├── components/
│   ├── Layout.tsx               # Top nav + page container + footer
│   ├── ProtectedRoute.tsx
│   └── ui/Button.tsx            # Brand-tokenized button
├── styles/
│   ├── brand.css                # CSS custom properties
│   └── globals.css              # Tailwind + base resets
├── tailwind.config.ts           # Brand tokens
└── postcss.config.js
```

## Implementation

### `tailwind.config.ts` — full config in `BRAND_TOKENS.md`

### `src/styles/brand.css`
```css
:root {
  --bg-page: #F8F5EE;
  --bg-card: #FFFFFF;
  --bg-soft: #F0EBE0;
  --brand-dark: #1C2820;
  --brand-accent: #A87432;
  --text-success: #4A7C3A;
  --text-warning: #B45309;
  --text-danger: #991B1B;
  --text-primary: #1C2820;
  --text-secondary: #5A6B5F;
  --text-tertiary: #8B9285;
  --border-light: rgba(28, 40, 32, 0.08);
}

body {
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

### `src/api/client.ts`
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yeldo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yeldo_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

### `src/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/client';

interface User { id: string; email: string; name: string; }
interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('yeldo_token');
    const storedUser = localStorage.getItem('yeldo_user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const persist = (user: User, token: string) => {
    localStorage.setItem('yeldo_token', token);
    localStorage.setItem('yeldo_user', JSON.stringify(user));
    setUser(user);
    setToken(token);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    persist(data.user, data.token);
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data } = await api.post('/api/auth/signup', { email, password, name });
    persist(data.user, data.token);
  };

  const demoLogin = async () => {
    const { data } = await api.post('/api/auth/demo-login', {});
    persist(data.user, data.token);
  };

  const logout = () => {
    localStorage.removeItem('yeldo_token');
    localStorage.removeItem('yeldo_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### `src/components/ProtectedRoute.tsx`
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}
```

### `src/App.tsx`
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
// import pages...

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/deals/:slug" element={<DealDetailPage />} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Cursor prompt

```
Set up the frontend shell at frontend/src/ matching this spec.
Install Tailwind CSS and configure it with the Editorial Forest + Brass tokens
from BRAND_TOKENS.md (forest, brass, sage greens, cream backgrounds).
Build AuthContext with login/signup/demoLogin/logout.
Create axios client with JWT interceptor.
Set up React Router with all 8 routes.
All page components can be placeholders for now (e.g., `<div>Discover</div>`).
The Layout component should have a top nav with logo + 4 links (Discover, Portfolio, Dashboard, Updates) and a footer.
```
