import { hashPassword } from '../utils/password';

const mockSendNotification = jest.fn().mockResolvedValue(undefined);
const mockDeleteMany = jest.fn().mockResolvedValue({ count: 1 });
const mockUserFindUnique = jest.fn();
const mockUserFindFirst = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock('../services/notification.client', () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    refreshToken: {
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
}));

import * as userService from '../services/user.service';

describe('Profile service security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('changePassword sends PASSWORD_CHANGED notification and clears sessions', async () => {
    const hash = await hashPassword('OldPass1!');
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: hash,
    });
    mockUserUpdate.mockResolvedValue({});

    await userService.changePassword('user-1', 'OldPass1!', 'NewPass1!');

    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'user@example.com',
        type: 'PASSWORD_CHANGED',
      }),
    );
  });

  it('updateProfile requires password when email changes', async () => {
    const hash = await hashPassword('OldPass1!');
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
      passwordHash: hash,
    });

    await expect(
      userService.updateProfile('user-1', { email: 'new@example.com' }),
    ).rejects.toThrow('PASSWORD_REQUIRED');
  });

  it('updateProfile sends EMAIL_CHANGED notifications when email changes', async () => {
    const hash = await hashPassword('OldPass1!');
    mockUserFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
      passwordHash: hash,
    });
    mockUserFindFirst.mockResolvedValue(null);
    mockUserUpdate.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
    });

    await userService.updateProfile('user-1', {
      email: 'new@example.com',
      currentPassword: 'OldPass1!',
    });

    expect(mockSendNotification).toHaveBeenCalledTimes(2);
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: 'old@example.com', type: 'EMAIL_CHANGED' }),
    );
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientEmail: 'new@example.com', type: 'EMAIL_CHANGED' }),
    );
  });
});
