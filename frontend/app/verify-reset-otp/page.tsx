'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { verifyResetOtpSchema, forgotPasswordSchema } from '@/lib/auth-schemas';
import { zodFieldErrors } from '@/lib/zod-utils';
import AuthLayout from '@/components/AuthLayout';
import AuthFormField from '@/components/AuthFormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/lib/toast-context';

const RESEND_COOLDOWN_SEC = 60;

function VerifyResetOtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const emailParam = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!emailParam) {
      router.replace('/forgot-password');
    }
  }, [emailParam, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setResendMessage('');

    const parsed = verifyResetOtpSchema.safeParse({ email: emailParam, otp });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      const res = await api<{ success: boolean; data: { resetSessionToken: string } }>('/auth/verify-reset-otp', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      sessionStorage.setItem('resetSessionToken', res.data.resetSessionToken);
      toast('Code verified. Choose your new password.', 'success');
      router.push('/reset-password');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !emailParam) return;
    setError('');
    setResendMessage('');

    const parsed = forgotPasswordSchema.safeParse({ email: emailParam });
    if (!parsed.success) return;

    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      setResendMessage('A new verification code has been sent if an account exists for that email.');
      toast('A new verification code has been sent if an account exists for that email.', 'success');
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setOtp('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!emailParam) return null;

  return (
    <AuthLayout title="Enter verification code" subtitle={`We sent a 6-digit code to ${emailParam}`}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {resendMessage && (
        <Alert variant="success" className="mb-6">
          <AlertDescription>{resendMessage}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthFormField
          id="otp"
          label="Verification code"
          value={otp}
          onChange={(v) => {
            const digits = v.replace(/\D/g, '').slice(0, 6);
            setOtp(digits);
            setFieldErrors((p) => {
              const n = { ...p };
              delete n.otp;
              return n;
            });
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          error={fieldErrors.otp}
        />
        <Button type="submit" disabled={loading || otp.length !== 6} className="w-full" size="lg">
          {loading ? 'Verifying...' : 'Verify code'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Didn&apos;t receive a code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || resendCooldown > 0}
          className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Use a different email
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function VerifyResetOtpPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full" />}>
      <VerifyResetOtpForm />
    </Suspense>
  );
}
