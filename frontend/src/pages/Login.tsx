import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { GoogleButton } from '../components/ui/GoogleButton';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

function messageOf(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    return e.message;
  }
  return 'Login failed';
}

export function Login() {
  const { login, demoLogin, loginWithGoogle, token } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (token) {
    return <Navigate to="/discover" replace />;
  }

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/discover';

  async function onSubmit(data: FormData) {
    try {
      await login(data.email, data.password);
      nav(redirectTo);
    } catch (e) {
      toast.error(messageOf(e));
    }
  }

  async function handleDemoLogin() {
    try {
      await demoLogin();
      nav('/discover');
    } catch {
      toast.error('Demo login failed');
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
      // Supabase redirects the page — control does not return here on success
    } catch (e) {
      toast.error(messageOf(e));
    }
  }

  function fillDemo() {
    setValue('email', import.meta.env.VITE_DEMO_EMAIL ?? 'ferdinand.straehuber@gmail.com');
    setValue('password', import.meta.env.VITE_DEMO_PASSWORD ?? 'demo123');
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h2 className="text-2xl font-medium mb-6 text-brand-dark">Sign in</h2>

      <GoogleButton onClick={handleGoogle} label="Continue with Google" />

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-border-light" />
        <span className="text-[11px] uppercase tracking-wide text-text-tertiary">or</span>
        <span className="flex-1 h-px bg-border-light" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Email</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="w-full px-3 py-2.5 border border-border-light rounded-md bg-card text-sm"
          />
          {errors.email && (
            <p className="text-text-danger text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Password</label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className="w-full px-3 py-2.5 border border-border-light rounded-md bg-card text-sm"
          />
          {errors.password && (
            <p className="text-text-danger text-xs mt-1">{errors.password.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-dark text-page rounded-md text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-border-light" />
        <span className="text-[11px] uppercase tracking-wide text-text-tertiary">demo</span>
        <span className="flex-1 h-px bg-border-light" />
      </div>

      <button
        onClick={handleDemoLogin}
        className="w-full py-3 border border-border-light rounded-md text-sm font-medium hover:bg-soft"
      >
        Sign in as recruiter →
      </button>
      <button
        onClick={fillDemo}
        className="w-full mt-2 py-2 text-xs text-text-secondary hover:text-text-primary"
      >
        Or fill demo credentials manually
      </button>

      <p className="text-center text-sm mt-6 text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/auth/signup" className="text-brand-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
