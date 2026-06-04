import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword, hashToken, compareToken } from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  generateResetToken,
  generateOtp,
  getRefreshExpiry,
  getOtpExpiry,
  getResetSessionExpiry,
} from '../utils/jwt';
import { sendNotification } from './notification.client';
import { config } from '../config/env';
import { Role } from '../generated/prisma/client';
import {
  passwordResetOtpEmail,
  welcomeEmail,
  passwordResetSuccessEmail,
} from '../templates/email-templates';

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRES_MINUTES = 10;

export async function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new Error('DUPLICATE_EMAIL');

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      role: Role.USER,
    },
  });

  const loginUrl = `${config.frontendUrl}/login`;
  const welcome = welcomeEmail({ firstName: user.firstName, loginUrl });
  await sendNotification({
    recipientEmail: user.email,
    subject: welcome.subject,
    body: welcome.text,
    html: welcome.html,
    type: 'WELCOME',
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      tokenHash: await hashToken(refreshToken),
      userId: user.id,
      expiresAt: getRefreshExpiry(),
    },
  });

  return { user, accessToken, refreshToken };
}

export async function logoutUser(refreshToken: string) {
  const tokens = await prisma.refreshToken.findMany();
  for (const t of tokens) {
    if (await compareToken(refreshToken, t.tokenHash)) {
      await prisma.refreshToken.delete({ where: { id: t.id } });
      return;
    }
  }
  throw new Error('TOKEN_NOT_FOUND');
}

export async function refreshTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyToken(refreshToken);
  } catch {
    throw new Error('INVALID_TOKEN');
  }

  const tokens = await prisma.refreshToken.findMany({ where: { userId: payload.userId } });
  let valid = false;
  for (const t of tokens) {
    if (await compareToken(refreshToken, t.tokenHash)) {
      if (t.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: t.id } });
        throw new Error('TOKEN_EXPIRED');
      }
      valid = true;
      await prisma.refreshToken.delete({ where: { id: t.id } });
      break;
    }
  }
  if (!valid) throw new Error('INVALID_TOKEN');

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const newPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await prisma.refreshToken.create({
    data: {
      tokenHash: await hashToken(newRefreshToken),
      userId: user.id,
      expiresAt: getRefreshExpiry(),
    },
  });

  return { user, accessToken, refreshToken: newRefreshToken };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return;

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  await prisma.passwordResetToken.create({
    data: {
      otpHash: await hashToken(otp),
      userId: user.id,
      expiresAt: getOtpExpiry(),
      attempts: 0,
    },
  });

  const emailContent = passwordResetOtpEmail({
    firstName: user.firstName,
    otp,
    expiresMinutes: OTP_EXPIRES_MINUTES,
  });

  await sendNotification({
    recipientEmail: user.email,
    subject: emailContent.subject,
    body: emailContent.text,
    html: emailContent.html,
    type: 'PASSWORD_RESET',
  });
}

export async function verifyResetOtp(email: string, otp: string): Promise<{ resetSessionToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error('INVALID_OTP');

  const resetRow = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, used: false, verifiedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!resetRow || !resetRow.otpHash) throw new Error('INVALID_OTP');

  if (resetRow.expiresAt < new Date()) throw new Error('OTP_EXPIRED');

  if (resetRow.attempts >= MAX_OTP_ATTEMPTS) throw new Error('TOO_MANY_ATTEMPTS');

  const otpValid = await compareToken(otp, resetRow.otpHash);
  if (!otpValid) {
    await prisma.passwordResetToken.update({
      where: { id: resetRow.id },
      data: { attempts: resetRow.attempts + 1 },
    });
    throw new Error('INVALID_OTP');
  }

  const resetSessionToken = generateResetToken();
  await prisma.passwordResetToken.update({
    where: { id: resetRow.id },
    data: {
      resetSessionTokenHash: await hashToken(resetSessionToken),
      verifiedAt: new Date(),
      sessionExpiresAt: getResetSessionExpiry(),
    },
  });

  return { resetSessionToken };
}

export async function resetPassword(resetSessionToken: string, newPassword: string) {
  const rows = await prisma.passwordResetToken.findMany({
    where: { used: false, verifiedAt: { not: null }, resetSessionTokenHash: { not: null } },
  });

  for (const row of rows) {
    if (!row.resetSessionTokenHash) continue;
    if (!(await compareToken(resetSessionToken, row.resetSessionTokenHash))) continue;

    if (row.sessionExpiresAt && row.sessionExpiresAt < new Date()) {
      throw new Error('INVALID_RESET_SESSION');
    }

    const user = await prisma.user.findUnique({ where: { id: row.userId } });
    if (!user) throw new Error('USER_NOT_FOUND');

    await prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    await prisma.passwordResetToken.update({ where: { id: row.id }, data: { used: true } });
    await prisma.refreshToken.deleteMany({ where: { userId: row.userId } });

    const successEmail = passwordResetSuccessEmail();
    await sendNotification({
      recipientEmail: user.email,
      subject: successEmail.subject,
      body: successEmail.text,
      html: successEmail.html,
      type: 'PASSWORD_RESET_SUCCESS',
    });
    return;
  }

  throw new Error('INVALID_RESET_SESSION');
}
