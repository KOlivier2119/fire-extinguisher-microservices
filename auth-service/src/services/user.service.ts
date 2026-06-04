import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { sendNotification } from './notification.client';
import { Role } from '../generated/prisma/client';

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; email?: string; currentPassword?: string },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const newEmail = data.email?.toLowerCase().trim();
  const emailChanging = Boolean(newEmail && newEmail !== user.email.toLowerCase());

  if (emailChanging) {
    if (!data.currentPassword) throw new Error('PASSWORD_REQUIRED');
    if (!(await comparePassword(data.currentPassword, user.passwordHash))) {
      throw new Error('INVALID_PASSWORD');
    }
    const existing = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: userId } },
    });
    if (existing) throw new Error('DUPLICATE_EMAIL');
  }

  const oldEmail = user.email;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(emailChanging && newEmail && { email: newEmail }),
    },
  });

  if (emailChanging && newEmail) {
    await sendNotification({
      recipientEmail: oldEmail,
      subject: 'Email changed on your TZW LTD FEMS account',
      body: `Your account email was changed to ${newEmail}.\n\nIf you did not make this change, contact support immediately.`,
      type: 'EMAIL_CHANGED',
    });
    await sendNotification({
      recipientEmail: newEmail,
      subject: 'Email linked to TZW LTD FEMS account',
      body: 'This email address is now linked to your TZW LTD FEMS account.\n\nIf you did not make this change, contact support immediately.',
      type: 'EMAIL_CHANGED',
    });
  }

  return updated;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    throw new Error('INVALID_PASSWORD');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await prisma.refreshToken.deleteMany({ where: { userId } });

  await sendNotification({
    recipientEmail: user.email,
    subject: 'Password changed - TZW LTD FEMS',
    body: 'Your password was successfully changed.\n\nIf you did not make this change, reset your password immediately.',
    type: 'PASSWORD_CHANGED',
  });
}

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function updateUserRole(userId: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  if (user.role === Role.ADMIN && role !== Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) throw new Error('LAST_ADMIN');
  }

  return prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function deleteUser(userId: string, actorUserId: string) {
  if (userId === actorUserId) throw new Error('SELF_DELETE');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  if (user.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) throw new Error('LAST_ADMIN');
  }

  await prisma.user.delete({ where: { id: userId } });
}
