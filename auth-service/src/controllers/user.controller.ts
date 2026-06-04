import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError, excludePassword } from '../utils/response';
import * as userService from '../services/user.service';

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await userService.getUserById(req.user!.userId);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, excludePassword(user));
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    return sendSuccess(res, excludePassword(user), 'Profile updated');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'DUPLICATE_EMAIL') {
      return sendError(res, 'Email already in use', 409, { email: ['Email already in use'] });
    }
    if (msg === 'PASSWORD_REQUIRED') {
      return sendError(res, 'Current password is required to change email', 400, {
        currentPassword: ['Current password is required to change your email'],
      });
    }
    if (msg === 'INVALID_PASSWORD') {
      return sendError(res, 'Current password is incorrect', 400, {
        currentPassword: ['Current password is incorrect'],
      });
    }
    if (msg === 'USER_NOT_FOUND') return sendError(res, 'User not found', 404);
    throw err;
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    await userService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    if ((err as Error).message === 'INVALID_PASSWORD') {
      return sendError(res, 'Current password is incorrect', 400, {
        currentPassword: ['Current password is incorrect'],
      });
    }
    throw err;
  }
}

export async function listUsers(req: AuthRequest, res: Response) {
  const users = await userService.listUsers();
  return sendSuccess(res, users.map(excludePassword));
}

export async function getUser(req: AuthRequest, res: Response) {
  const user = await userService.getUserById(req.params.id as string);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, excludePassword(user));
}

export async function updateRole(req: AuthRequest, res: Response) {
  try {
    const user = await userService.updateUserRole(req.params.id as string, req.body.role);
    return sendSuccess(res, excludePassword(user), 'Role updated');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'USER_NOT_FOUND') return sendError(res, 'User not found', 404);
    if (msg === 'LAST_ADMIN') return sendError(res, 'Cannot demote the last admin', 400);
    throw err;
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    await userService.deleteUser(req.params.id as string, req.user!.userId);
    return sendSuccess(res, null, 'User deleted');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'USER_NOT_FOUND') return sendError(res, 'User not found', 404);
    if (msg === 'LAST_ADMIN') return sendError(res, 'Cannot delete the last admin', 400);
    if (msg === 'SELF_DELETE') return sendError(res, 'You cannot delete your own account', 400);
    throw err;
  }
}

export async function listInspectors(req: AuthRequest, res: Response) {
  const users = await userService.listUsers();
  const inspectors = users.filter(u => u.role === 'INSPECTOR' || u.role === 'ADMIN').map(excludePassword);
  return sendSuccess(res, inspectors);
}
