const mockUserFindUnique = jest.fn();
const mockUserCount = jest.fn();
const mockUserDelete = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      count: (...args: unknown[]) => mockUserCount(...args),
      delete: (...args: unknown[]) => mockUserDelete(...args),
    },
  },
}));

import { Role } from '../generated/prisma/client';
import * as userService from '../services/user.service';

describe('User admin service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deleteUser blocks self deletion', async () => {
    await expect(userService.deleteUser('user-1', 'user-1')).rejects.toThrow('SELF_DELETE');
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it('deleteUser blocks deleting the last admin', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    mockUserCount.mockResolvedValue(1);

    await expect(userService.deleteUser('admin-1', 'admin-2')).rejects.toThrow('LAST_ADMIN');
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it('deleteUser removes a non-admin user', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'user-2', role: Role.USER });
    mockUserDelete.mockResolvedValue({});

    await userService.deleteUser('user-2', 'admin-1');

    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: 'user-2' } });
  });

  it('updateUserRole blocks demoting the last admin', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN });
    mockUserCount.mockResolvedValue(1);

    await expect(userService.updateUserRole('admin-1', Role.USER)).rejects.toThrow('LAST_ADMIN');
  });
});
