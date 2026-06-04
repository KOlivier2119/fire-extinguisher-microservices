import { z } from 'zod';

const PASSWORD_REQUIREMENTS = [
  { test: (v: string) => v.length >= 8, message: 'At least 8 characters' },
  { test: (v: string) => /[A-Z]/.test(v), message: 'At least one uppercase letter' },
  { test: (v: string) => /[a-z]/.test(v), message: 'At least one lowercase letter' },
  { test: (v: string) => /[0-9]/.test(v), message: 'At least one number' },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), message: 'At least one special character' },
] as const;

export const strongPasswordSchema = z.string().superRefine((val, ctx) => {
  if (!val) {
    ctx.addIssue({ code: 'custom', message: 'Password is required' });
    return;
  }
  if (val.length > 128) {
    ctx.addIssue({ code: 'custom', message: 'Password must be 128 characters or less' });
  }
  for (const rule of PASSWORD_REQUIREMENTS) {
    if (!rule.test(val)) {
      ctx.addIssue({ code: 'custom', message: rule.message });
    }
  }
});
