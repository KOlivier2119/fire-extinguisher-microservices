'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { resetPasswordSchema } from '@/lib/auth-schemas';
import { zodFieldErrors } from '@/lib/zod-utils';
import AuthLayout from '@/components/AuthLayout';
import AuthFormField from '@/components/AuthFormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/lib/toast-context';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [resetSessionToken, setResetSessionToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('resetSessionToken');
    if (!token) {
      router.replace('/forgot-password');
      return;
    }
    setResetSessionToken(token);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetSessionToken) return;

    setError('');
    setFieldErrors({});

    const parsed = resetPasswordSchema.safeParse({ resetSessionToken, newPassword: password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST', body: JSON.stringify(parsed.data),
      });
      sessionStorage.removeItem('resetSessionToken');
      router.replace('/login?reset=success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (resetSessionToken === null) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your account">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthFormField
          id="password"
          label="New Password"
          type="password"
          value={password}
          onChange={(v) => { setPassword(v); setFieldErrors((p) => { const n = { ...p }; delete n.newPassword; return n; }); }}
          autoComplete="new-password"
          maxLength={128}
          error={fieldErrors.newPassword}
        />
        <p className="text-xs text-muted-foreground">
          Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.
        </p>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
