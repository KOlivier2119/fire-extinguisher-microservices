import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError, excludePassword } from '../utils/response';
import * as authService from '../services/auth.service';

export async function register(req: AuthRequest, res: Response) {
  try {
    const user = await authService.registerUser(req.body);
    return sendSuccess(res, excludePassword(user), 'Registration successful', 201);
  } catch (err) {
    if ((err as Error).message === 'DUPLICATE_EMAIL') {
      return sendError(res, 'Email already registered', 409);
    }
    throw err;
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body.email, req.body.password);
    return sendSuccess(res, {
      user: excludePassword(user),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (err) {
    if ((err as Error).message === 'INVALID_CREDENTIALS') {
      return sendError(res, 'Invalid email or password', 401);
    }
    throw err;
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    await authService.logoutUser(req.body.refreshToken);
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    if ((err as Error).message === 'TOKEN_NOT_FOUND') {
      return sendError(res, 'Refresh token not found', 404);
    }
    throw err;
  }
}

export async function refresh(req: AuthRequest, res: Response) {
  try {
    const { user, accessToken, refreshToken } = await authService.refreshTokens(req.body.refreshToken);
    return sendSuccess(res, { user: excludePassword(user), accessToken, refreshToken });
  } catch (err) {
    const msg = (err as Error).message;
    if (['INVALID_TOKEN', 'TOKEN_EXPIRED', 'USER_NOT_FOUND'].includes(msg)) {
      return sendError(res, 'Invalid refresh token', 401);
    }
    throw err;
  }
}

export async function me(req: AuthRequest, res: Response) {
  const { getUserById } = await import('../services/user.service');
  const user = await getUserById(req.user!.userId);
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, excludePassword(user));
}

export async function forgotPassword(req: AuthRequest, res: Response) {
  await authService.forgotPassword(req.body.email);
  return sendSuccess(res, null, 'If the email exists, a verification code has been sent');
}

export async function verifyResetOtp(req: AuthRequest, res: Response) {
  try {
    const result = await authService.verifyResetOtp(req.body.email, req.body.otp);
    return sendSuccess(res, result, 'OTP verified');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'INVALID_OTP') {
      return sendError(res, 'Invalid verification code', 400);
    }
    if (msg === 'OTP_EXPIRED') {
      return sendError(res, 'Verification code has expired', 400);
    }
    if (msg === 'TOO_MANY_ATTEMPTS') {
      return sendError(res, 'Too many failed attempts. Request a new code.', 429);
    }
    throw err;
  }
}

export async function resetPassword(req: AuthRequest, res: Response) {
  try {
    await authService.resetPassword(req.body.resetSessionToken, req.body.newPassword);
    return sendSuccess(res, null, 'Password reset successful');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'INVALID_RESET_SESSION') {
      return sendError(res, 'Invalid or expired reset session', 400);
    }
    throw err;
  }
}
