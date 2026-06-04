import { z } from 'zod';
import { strongPasswordSchema } from './password.validator';
import { firstNameSchema, lastNameSchema } from './name.validator';

export const registerSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: z.string().email(),
  password: strongPasswordSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const resetPasswordSchema = z.object({
  resetSessionToken: z.string().min(1),
  newPassword: strongPasswordSchema,
});

export const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'INSPECTOR', 'USER']),
});
