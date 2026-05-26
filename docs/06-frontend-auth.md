# Spec 06 — Frontend auth pages

**Goal:** Build the Login and Signup pages, plus the Landing page with the *"Sign in as recruiter"* button.

**Time:** 60 minutes
**Depends on:** `05-frontend-setup-with-tokens`
**Outputs:** 3 polished auth-related pages

---

## Acceptance criteria

- [ ] `/` (Landing) shows hero + 3 CTAs: "Sign in as recruiter", "Sign up", "Browse deals"
- [ ] "Sign in as recruiter" calls `demoLogin()` and redirects to `/discover`
- [ ] `/auth/login` has form with email + password, error toast on failure
- [ ] `/auth/login` has "Use demo account" button that pre-fills credentials
- [ ] `/auth/signup` has form with email + password + name, error toast on failure
- [ ] Forms use React Hook Form + Zod for validation
- [ ] Successful auth redirects to `/discover`
- [ ] Already-authenticated users visiting `/auth/login` redirect to `/discover`

## Files to create

```
frontend/src/
├── pages/Landing.tsx
├── pages/Login.tsx
├── pages/Signup.tsx
├── components/AuthForm.tsx     # Shared form layout
└── lib/toast.ts                # Lightweight toast (or use react-hot-toast)
```

## Implementation highlights

### `src/pages/Landing.tsx`
```jsx
export function Landing() {
  const nav = useNavigate();
  const { demoLogin } = useAuth();

  const handleDemoLogin = async () => {
    try {
      await demoLogin();
      nav('/discover');
    } catch (e) {
      toast.error('Demo login failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-medium tracking-tight mb-4">
        Yeldo Deal Tracker
      </h1>
      <p className="text-text-secondary text-lg mb-8 leading-relaxed">
        A fullstack portfolio piece demonstrating production patterns for real-estate
        investment platforms. Built with React, Express, PostgreSQL, and two ML
        features citing real research.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-12">
        <button
          onClick={handleDemoLogin}
          className="px-6 py-3 bg-brand-dark text-page rounded-md font-medium hover:opacity-90"
        >
          Sign in as recruiter →
        </button>
        <Link
          to="/auth/signup"
          className="px-6 py-3 border border-border-light rounded-md text-center hover:bg-soft"
        >
          Sign up
        </Link>
        <Link
          to="/discover"
          className="px-6 py-3 text-text-secondary hover:text-text-primary text-center"
        >
          Browse public deals
        </Link>
      </div>

      <div className="bg-soft rounded-lg p-6 text-sm">
        <p className="font-medium mb-2">Why "Sign in as recruiter"?</p>
        <p className="text-text-secondary leading-relaxed">
          One-click access to a pre-populated demo account with 6 mock investments
          across Italy, Switzerland, Spain, and Germany. No signup friction —
          designed to let you explore the full platform in under 5 minutes.
        </p>
      </div>
    </div>
  );
}
```

### `src/pages/Login.tsx`
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export function Login() {
  const { login, demoLogin } = useAuth();
  const nav = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      nav('/discover');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Login failed');
    }
  };

  const fillDemo = () => {
    setValue('email', 'ferdinand.straehuber@gmail.com');
    setValue('password', 'demo123');
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h2 className="text-2xl font-medium mb-6">Sign in</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 border border-border-light rounded-md bg-card"
          />
          {errors.email && <p className="text-text-danger text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full px-3 py-2 border border-border-light rounded-md bg-card"
          />
          {errors.password && <p className="text-text-danger text-xs mt-1">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-dark text-page rounded-md font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <button
        onClick={fillDemo}
        className="w-full mt-4 py-2 border border-border-light rounded-md text-sm text-text-secondary hover:bg-soft"
      >
        Use demo account
      </button>

      <p className="text-center text-sm mt-6 text-text-secondary">
        Don't have an account?{' '}
        <Link to="/auth/signup" className="text-brand-accent hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
```

### `src/pages/Signup.tsx` follows the same pattern with `name` + `email` + `password` fields.

## Toast setup

Install `react-hot-toast`:
```bash
npm install react-hot-toast
```

In `App.tsx`:
```jsx
import { Toaster } from 'react-hot-toast';
// add inside AuthProvider:
<Toaster position="bottom-right" />
```

## Cursor prompt

```
Build the Landing, Login, and Signup pages at frontend/src/pages/ matching the spec.
Use React Hook Form + Zod for validation.
Install and configure react-hot-toast for error notifications.
The Landing page's primary CTA is "Sign in as recruiter" which calls demoLogin().
The Login page has a "Use demo account" button that pre-fills the demo credentials.
Style with Tailwind using brand tokens (bg-brand-dark, text-page, border-border-light, etc.).
```
