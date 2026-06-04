import { prisma } from '../lib/prisma';
import { sendNotification } from './notification.client';
import { JwtPayload } from '../config/env';
import { startOfDay } from '../utils/response';
import { combineDateAndTime } from '../validators/date.utils';

export async function scheduleInspection(data: {
  extinguisherId: string;
  scheduledDate: string;
  scheduledTime: string;
  assignedInspectorId: string;
  assignedInspectorEmail: string;
  notes?: string;
}, creator: JwtPayload) {
  const extinguisher = await prisma.fireExtinguisher.findUnique({ where: { id: data.extinguisherId } });
  if (!extinguisher) throw new Error('NOT_FOUND');
  if (extinguisher.status === 'DECOMMISSIONED') throw new Error('EXTINGUISHER_DECOMMISSIONED');

  const scheduledAt = combineDateAndTime(data.scheduledDate, data.scheduledTime);
  if (!scheduledAt || scheduledAt.getTime() <= Date.now()) throw new Error('SCHEDULED_IN_PAST');

  const inspection = await prisma.inspection.create({
    data: {
      extinguisherId: data.extinguisherId,
      scheduledDate: scheduledAt,
      scheduledTime: data.scheduledTime,
      assignedInspectorId: data.assignedInspectorId,
      assignedInspectorEmail: data.assignedInspectorEmail,
      createdById: creator.userId,
      createdByEmail: creator.email,
      notes: data.notes,
    },
    include: { extinguisher: true },
  });

  const msg = `Inspection scheduled for fire extinguisher ${extinguisher.serialNumber} at ${extinguisher.location}.\nDate: ${data.scheduledDate}\nTime: ${data.scheduledTime}`;

  await sendNotification({
    recipientEmail: data.assignedInspectorEmail,
    subject: `Inspection Scheduled - ${extinguisher.serialNumber}`,
    body: msg,
    type: 'INSPECTION_SCHEDULED',
  });

  if (creator.email !== data.assignedInspectorEmail) {
    await sendNotification({
      recipientEmail: creator.email,
      subject: `Inspection Scheduled - ${extinguisher.serialNumber}`,
      body: msg,
      type: 'INSPECTION_SCHEDULED',
    });
  }

  return inspection;
}

export async function listInspections(user: JwtPayload, status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (user.role === 'USER') where.createdById = user.userId;
  if (user.role === 'INSPECTOR') where.assignedInspectorId = user.userId;

  return prisma.inspection.findMany({
    where,
    include: { extinguisher: true },
    orderBy: { scheduledDate: 'desc' },
  });
}

export function canAccessInspection(
  inspection: { createdById: string; assignedInspectorId: string },
  user: JwtPayload
): boolean {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'USER') return inspection.createdById === user.userId;
  if (user.role === 'INSPECTOR') return inspection.assignedInspectorId === user.userId;
  return false;
}

export async function getInspection(id: string, user: JwtPayload) {
  const inspection = await prisma.inspection.findUnique({ where: { id }, include: { extinguisher: true } });
  if (!inspection) throw new Error('NOT_FOUND');
  if (!canAccessInspection(inspection, user)) throw new Error('FORBIDDEN');
  return inspection;
}

export async function completeInspection(id: string, user: JwtPayload) {
  const existing = await prisma.inspection.findUnique({ where: { id } });
  if (!existing) throw new Error('NOT_FOUND');
  if (user.role === 'INSPECTOR' && existing.assignedInspectorId !== user.userId) {
    throw new Error('FORBIDDEN');
  }
  return prisma.inspection.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: { extinguisher: true },
  });
}

export async function cancelInspection(id: string, user: JwtPayload) {
  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) throw new Error('NOT_FOUND');
  if (user.role === 'USER' && inspection.createdById !== user.userId) {
    throw new Error('FORBIDDEN');
  }
  if (user.role === 'INSPECTOR' && inspection.assignedInspectorId !== user.userId) {
    throw new Error('FORBIDDEN');
  }
  return prisma.inspection.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { extinguisher: true },
  });
}

export async function markOverdueInspections() {
  const today = startOfDay(new Date());
  const overdue = await prisma.inspection.findMany({
    where: { status: 'PENDING', scheduledDate: { lt: today } },
    include: { extinguisher: true },
  });

  for (const insp of overdue) {
    await prisma.inspection.update({ where: { id: insp.id }, data: { status: 'OVERDUE' } });
    if (insp.assignedInspectorEmail) {
      await sendNotification({
        recipientEmail: insp.assignedInspectorEmail,
        subject: `Overdue Inspection - ${insp.extinguisher.serialNumber}`,
        body: `Inspection for ${insp.extinguisher.serialNumber} at ${insp.extinguisher.location} is overdue.`,
        type: 'INSPECTION_OVERDUE',
      });
    }
  }
}

export async function getInspectionsByStatus(status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED') {
  return prisma.inspection.findMany({
    where: { status },
    include: { extinguisher: true },
    orderBy: { scheduledDate: 'desc' },
  });
}
