'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PORTAL_HOME } from '@/lib/rbac';
import { loginSchema, zodFieldErrors } from '@/lib/auth-schemas';
import AuthLayout from '@/components/AuthLayout';
import AuthFormField from '@/components/AuthFormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/lib/toast-context';

function LoginForm() {
  const { login, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<'registered' | 'reset' | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    router.replace(PORTAL_HOME[user.role]);
  }, [user, authLoading, router]);

  useEffect(() => {
    const registered = searchParams.get('registered');
    const reset = searchParams.get('reset');
    const emailParam = searchParams.get('email');

    if (emailParam) setEmail(emailParam);
    if (registered === '1') {
      setBanner('registered');
      toast('Account created successfully — sign in with your email.', 'success');
    } else if (reset === 'success') {
      setBanner('reset');
      toast('Password reset successful — sign in with your new password.', 'success');
    }

    if (registered || reset || emailParam) {
      router.replace('/login');
    }
  }, [searchParams, router, toast]);

  if (authLoading || user) return null;

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const loggedIn = await login(parsed.data.email, parsed.data.password);
      router.push(PORTAL_HOME[loggedIn.role]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your fire extinguishers">
      {banner === 'registered' && (
        <Alert variant="success" className="mb-6">
          <AlertDescription>
            Account created successfully — sign in with your email. Check your inbox for a welcome email.
          </AlertDescription>
        </Alert>
      )}
      {banner === 'reset' && (
        <Alert variant="success" className="mb-6">
          <AlertDescription>
            Password reset successful — sign in with your new password.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthFormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); clearFieldError('email'); }}
          autoComplete="email"
          maxLength={255}
          error={fieldErrors.email}
        />
        <AuthFormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(v) => { setPassword(v); clearFieldError('password'); }}
          autoComplete="current-password"
          maxLength={128}
          error={fieldErrors.password}
        />
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <div className="mt-8 space-y-2 text-center text-sm">
        <p>
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <LoginForm />
    </Suspense>
  );
}
