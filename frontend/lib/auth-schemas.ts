import { z } from 'zod';
export { zodFieldErrors, firstZodError } from './zod-utils';

export const PASSWORD_REQUIREMENTS = [
  { id: 'length', test: (v: string) => v.length >= 8, message: 'At least 8 characters' },
  { id: 'upper', test: (v: string) => /[A-Z]/.test(v), message: 'At least one uppercase letter (A–Z)' },
  { id: 'lower', test: (v: string) => /[a-z]/.test(v), message: 'At least one lowercase letter (a–z)' },
  { id: 'number', test: (v: string) => /[0-9]/.test(v), message: 'At least one number (0–9)' },
  { id: 'special', test: (v: string) => /[^A-Za-z0-9]/.test(v), message: 'At least one special character (e.g. !@#$%)' },
] as const;

function applyPasswordComplexity(val: string, ctx: z.RefinementCtx, requiredMessage = 'Password is required') {
  if (!val) {
    ctx.addIssue({ code: 'custom', message: requiredMessage });
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
}

/** Registration & password changes — uppercase, lowercase, number, special char */
export const strongPasswordSchema = z.string().superRefine((val, ctx) => {
  applyPasswordComplexity(val, ctx);
});

/** Login — required + max length only (do not block existing accounts) */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password must be 128 characters or less');

const NAME_PATTERN = /^[\p{L}\s'-]+$/u;

function createNameSchema(fieldLabel: 'First name' | 'Last name') {
  return z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({ code: 'custom', message: `${fieldLabel} is required` });
        return;
      }
      if (val.length > 100) {
        ctx.addIssue({ code: 'custom', message: `${fieldLabel} must be 100 characters or less` });
      }
      if (!NAME_PATTERN.test(val)) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldLabel} may only contain letters, spaces, hyphens, and apostrophes`,
        });
      }
    });
}

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(255, 'Email must be 255 characters or less');

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registerSchema = z.object({
  firstName: createNameSchema('First name'),
  lastName: createNameSchema('Last name'),
  email: emailSchema,
  password: strongPasswordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyResetOtpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit verification code'),
});

export const resetPasswordSchema = z.object({
  resetSessionToken: z.string().min(1, 'Reset session is required'),
  newPassword: strongPasswordSchema,
});

export const updateProfileSchema = z.object({
  firstName: createNameSchema('First name'),
  lastName: createNameSchema('Last name'),
  email: emailSchema,
  currentPassword: z.string().optional(),
});

/** Validates profile update; requires currentPassword when email changes */
export function createUpdateProfileSchema(originalEmail: string) {
  return updateProfileSchema.superRefine((data, ctx) => {
    if (data.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase()) {
      if (!data.currentPassword?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Current password is required to change your email',
          path: ['currentPassword'],
        });
      }
    }
  });
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
      });
    }
  });
