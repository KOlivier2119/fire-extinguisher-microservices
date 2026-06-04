import { hashPassword, hashToken } from '../utils/password';

const mockSendNotification = jest.fn().mockResolvedValue(undefined);
const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockPasswordResetUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
const mockPasswordResetCreate = jest.fn();
const mockPasswordResetFindFirst = jest.fn();
const mockPasswordResetFindMany = jest.fn();
const mockPasswordResetUpdate = jest.fn();
const mockUserUpdate = jest.fn();
const mockRefreshTokenDeleteMany = jest.fn().mockResolvedValue({ count: 1 });

jest.mock('../services/notification.client', () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

jest.mock('../utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
  generateResetToken: jest.fn(() => 'session-token-hex'),
  generateOtp: jest.fn(() => '123456'),
  getRefreshExpiry: jest.fn(() => new Date(Date.now() + 86400000)),
  getOtpExpiry: jest.fn(() => new Date(Date.now() + 600000)),
  getResetSessionExpiry: jest.fn(() => new Date(Date.now() + 900000)),
}));

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    passwordResetToken: {
      updateMany: (...args: unknown[]) => mockPasswordResetUpdateMany(...args),
      create: (...args: unknown[]) => mockPasswordResetCreate(...args),
      findFirst: (...args: unknown[]) => mockPasswordResetFindFirst(...args),
      findMany: (...args: unknown[]) => mockPasswordResetFindMany(...args),
      update: (...args: unknown[]) => mockPasswordResetUpdate(...args),
    },
    refreshToken: {
      deleteMany: (...args: unknown[]) => mockRefreshTokenDeleteMany(...args),
    },
  },
}));

import * as authService from '../services/auth.service';

describe('OTP password reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forgotPassword sends OTP email with HTML', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Jane',
    });
    mockPasswordResetCreate.mockResolvedValue({});

    await authService.forgotPassword('user@example.com');

    expect(mockPasswordResetUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', used: false },
      data: { used: true },
    });
    expect(mockPasswordResetCreate).toHaveBeenCalled();
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'user@example.com',
        type: 'PASSWORD_RESET',
        html: expect.stringContaining('123456'),
      }),
    );
  });

  it('forgotPassword does nothing for unknown email', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    await authService.forgotPassword('missing@example.com');
    expect(mockPasswordResetCreate).not.toHaveBeenCalled();
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('verifyResetOtp returns session token on success', async () => {
    const otpHash = await hashToken('123456');
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    mockPasswordResetFindFirst.mockResolvedValue({
      id: 'reset-1',
      otpHash,
      expiresAt: new Date(Date.now() + 600000),
      attempts: 0,
    });
    mockPasswordResetUpdate.mockResolvedValue({});

    const result = await authService.verifyResetOtp('user@example.com', '123456');

    expect(result.resetSessionToken).toBe('session-token-hex');
    expect(mockPasswordResetUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reset-1' },
        data: expect.objectContaining({ verifiedAt: expect.any(Date) }),
      }),
    );
  });

  it('verifyResetOtp rejects invalid OTP and increments attempts', async () => {
    const otpHash = await hashToken('999999');
    mockUserFindUnique.mockResolvedValue({ id: 'user-1' });
    mockPasswordResetFindFirst.mockResolvedValue({
      id: 'reset-1',
      otpHash,
      expiresAt: new Date(Date.now() + 600000),
      attempts: 0,
    });

    await expect(authService.verifyResetOtp('user@example.com', '123456')).rejects.toThrow('INVALID_OTP');
    expect(mockPasswordResetUpdate).toHaveBeenCalledWith({
      where: { id: 'reset-1' },
      data: { attempts: 1 },
    });
  });

  it('verifyResetOtp rejects expired OTP', async () => {
    const otpHash = await hashToken('123456');
    mockUserFindUnique.mockResolvedValue({ id: 'user-1' });
    mockPasswordResetFindFirst.mockResolvedValue({
      id: 'reset-1',
      otpHash,
      expiresAt: new Date(Date.now() - 1000),
      attempts: 0,
    });

    await expect(authService.verifyResetOtp('user@example.com', '123456')).rejects.toThrow('OTP_EXPIRED');
  });

  it('verifyResetOtp rejects when too many attempts', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'user-1' });
    mockPasswordResetFindFirst.mockResolvedValue({
      id: 'reset-1',
      otpHash: 'hash',
      expiresAt: new Date(Date.now() + 600000),
      attempts: 5,
    });

    await expect(authService.verifyResetOtp('user@example.com', '123456')).rejects.toThrow('TOO_MANY_ATTEMPTS');
  });

  it('resetPassword updates password and sends confirmation email', async () => {
    const sessionHash = await hashToken('session-token-hex');
    mockPasswordResetFindMany.mockResolvedValue([
      {
        id: 'reset-1',
        userId: 'user-1',
        resetSessionTokenHash: sessionHash,
        sessionExpiresAt: new Date(Date.now() + 900000),
      },
    ]);
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    mockUserUpdate.mockResolvedValue({});
    mockPasswordResetUpdate.mockResolvedValue({});

    await authService.resetPassword('session-token-hex', 'NewPass1!');

    expect(mockUserUpdate).toHaveBeenCalled();
    expect(mockRefreshTokenDeleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PASSWORD_RESET_SUCCESS', html: expect.any(String) }),
    );
  });
});

describe('Registration welcome email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registerUser sends WELCOME notification', async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    await authService.registerUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'SecurePass1!',
    });

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'jane@example.com',
        type: 'WELCOME',
        html: expect.stringContaining('Welcome'),
      }),
    );
  });
});
