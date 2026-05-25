import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { GoogleButton } from '../components/ui/GoogleButton';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
type FormData = z.infer<typeof schema>;

function messageOf(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    return e.message;
  }
  return 'Signup failed';
}

export function Signup() {
  const { signup, loginWithGoogle, token } = useAuth();
  const nav = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (token) {
    return <Navigate to="/discover" replace />;
  }

  async function onSubmit(data: FormData) {
    try {
      await signup(data.email, data.password, data.name);
      toast.success('Welcome to Yeldo — check your inbox to confirm');
      nav('/discover');
    } catch (e) {
      toast.error(messageOf(e));
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
    } catch (e) {
      toast.error(messageOf(e));
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h2 className="text-2xl font-medium mb-6 text-brand-dark">Create your account</h2>

      <GoogleButton onClick={handleGoogle} label="Sign up with Google" />

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-border-light" />
        <span className="text-[11px] uppercase tracking-wide text-text-tertiary">or</span>
        <span className="flex-1 h-px bg-border-light" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1.5">Name</label>
          <input
            {...register('name')}
            type="text"
            autoComplete="name"
            className="w-full px-3 py-2.5 border border-border-light rounded-md bg-card text-sm"
          />
          {errors.name && <p className="text-text-danger text-xs mt-1">{errors.name.message}</p>}
        </div>
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
            autoComplete="new-password"
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm mt-6 text-text-secondary">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
