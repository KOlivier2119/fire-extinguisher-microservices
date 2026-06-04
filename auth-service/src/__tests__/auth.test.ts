import { hashPassword, comparePassword } from '../utils/password';

describe('Password utilities', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('TestPassword123');
    expect(hash).not.toBe('TestPassword123');
    expect(await comparePassword('TestPassword123', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});

describe('Auth validation', () => {
  it('register schema requires valid email', () => {
    const { registerSchema } = require('../validators/auth.validator');
    const result = registerSchema.safeParse({
      firstName: 'Test', lastName: 'User', email: 'invalid', password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('register schema rejects empty first name', () => {
    const { registerSchema } = require('../validators/auth.validator');
    const result = registerSchema.safeParse({
      firstName: '', lastName: 'User', email: 'test@example.com', password: 'SecurePass1!',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i: { message: string }) => i.message === 'First name is required')).toBe(true);
  });

  it('register schema rejects invalid characters in name', () => {
    const { registerSchema } = require('../validators/auth.validator');
    const result = registerSchema.safeParse({
      firstName: 'John123', lastName: 'User', email: 'test@example.com', password: 'SecurePass1!',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i: { message: string }) =>
      i.message.includes('may only contain letters'))).toBe(true);
  });

  it('register schema rejects weak password', () => {
    const { registerSchema } = require('../validators/auth.validator');
    const result = registerSchema.safeParse({
      firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('register schema accepts strong password', () => {
    const { registerSchema } = require('../validators/auth.validator');
    const result = registerSchema.safeParse({
      firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'SecurePass1!',
    });
    expect(result.success).toBe(true);
  });

  it('verifyResetOtp schema requires 6-digit OTP', () => {
    const { verifyResetOtpSchema } = require('../validators/auth.validator');
    expect(verifyResetOtpSchema.safeParse({ email: 'test@example.com', otp: '12345' }).success).toBe(false);
    expect(verifyResetOtpSchema.safeParse({ email: 'test@example.com', otp: '123456' }).success).toBe(true);
  });

  it('resetPassword schema requires resetSessionToken', () => {
    const { resetPasswordSchema } = require('../validators/auth.validator');
    expect(resetPasswordSchema.safeParse({ newPassword: 'SecurePass1!' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({
      resetSessionToken: 'abc', newPassword: 'SecurePass1!',
    }).success).toBe(true);
  });

  it('update profile schema accepts currentPassword when email changes', () => {
    const { updateProfileSchema } = require('../validators/auth.validator');
    const result = updateProfileSchema.safeParse({
      email: 'new@example.com',
      currentPassword: 'SecretPass1!',
    });
    expect(result.success).toBe(true);
  });
});

describe('Logout validation', () => {
  it('logout schema requires refreshToken', () => {
    const { logoutSchema } = require('../validators/auth.validator');
    expect(logoutSchema.safeParse({}).success).toBe(false);
    expect(logoutSchema.safeParse({ refreshToken: 'abc' }).success).toBe(true);
  });
});
