'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { registerSchema, zodFieldErrors } from '@/lib/auth-schemas';
import AuthLayout from '@/components/AuthLayout';
import AuthFormField from '@/components/AuthFormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const INITIAL_FORM: RegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (key: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setLoading(true);
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify(parsed.data) });
      toast('Account created successfully. Check your inbox for a welcome email.', 'success');
      router.replace(`/login?registered=1&email=${encodeURIComponent(parsed.data.email)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join TZW LTD FEMS to get started">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AuthFormField
            id="firstName"
            label="First name"
            value={form.firstName}
            onChange={(v) => updateField('firstName', v)}
            autoComplete="given-name"
            maxLength={100}
            error={fieldErrors.firstName}
          />
          <AuthFormField
            id="lastName"
            label="Last name"
            value={form.lastName}
            onChange={(v) => updateField('lastName', v)}
            autoComplete="family-name"
            maxLength={100}
            error={fieldErrors.lastName}
          />
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Names may only contain letters, spaces, hyphens, and apostrophes (max 100 characters each).
        </p>
        <AuthFormField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => updateField('email', v)}
          autoComplete="email"
          maxLength={255}
          error={fieldErrors.email}
        />
        <AuthFormField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => updateField('password', v)}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          error={fieldErrors.password}
        />
        <p className="text-xs text-muted-foreground">
          Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.
        </p>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
