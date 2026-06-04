'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { forgotPasswordSchema } from '@/lib/auth-schemas';
import { zodFieldErrors } from '@/lib/zod-utils';
import AuthLayout from '@/components/AuthLayout';
import AuthFormField from '@/components/AuthFormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST', body: JSON.stringify(parsed.data),
      });
      toast('Verification code sent. Check your email.', 'success');
      router.push(`/verify-reset-otp?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email and we'll send a verification code">
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
          onChange={(v) => { setEmail(v); setFieldErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
          maxLength={255}
          error={fieldErrors.email}
        />
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Sending...' : 'Send verification code'}
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
