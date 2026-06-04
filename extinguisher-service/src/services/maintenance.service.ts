import { prisma } from '../lib/prisma';
import { JwtPayload } from '../config/env';
import { startOfDay } from '../utils/response';
import { parseDateOnly } from '../validators/date.utils';

export async function logMaintenance(data: {
  extinguisherId: string;
  actionTaken: string;
  maintenanceDate: string;
  issuesIdentified?: string;
  notes?: string;
  recommendations?: string;
}, inspector: JwtPayload) {
  const extinguisher = await prisma.fireExtinguisher.findUnique({ where: { id: data.extinguisherId } });
  if (!extinguisher) throw new Error('NOT_FOUND');

  const maintenanceDate = parseDateOnly(data.maintenanceDate);
  if (!maintenanceDate) throw new Error('INVALID_MAINTENANCE_DATE');
  if (startOfDay(maintenanceDate) > startOfDay(new Date())) throw new Error('MAINTENANCE_DATE_FUTURE');
  if (startOfDay(maintenanceDate) < startOfDay(extinguisher.installationDate)) {
    throw new Error('MAINTENANCE_BEFORE_INSTALL');
  }

  return prisma.maintenanceLog.create({
    data: {
      extinguisherId: data.extinguisherId,
      inspectorId: inspector.userId,
      inspectorEmail: inspector.email,
      actionTaken: data.actionTaken,
      maintenanceDate,
      issuesIdentified: data.issuesIdentified,
      notes: data.notes,
      recommendations: data.recommendations,
    },
    include: { extinguisher: true },
  });
}

export async function listMaintenance() {
  return prisma.maintenanceLog.findMany({
    include: { extinguisher: true },
    orderBy: { maintenanceDate: 'desc' },
  });
}

export async function getMaintenance(id: string) {
  return prisma.maintenanceLog.findUnique({ where: { id }, include: { extinguisher: true } });
}

export async function getMaintenanceByExtinguisher(extinguisherId: string) {
  return prisma.maintenanceLog.findMany({
    where: { extinguisherId },
    orderBy: { maintenanceDate: 'desc' },
  });
}

export async function getRecentMaintenance(limit = 10) {
  return prisma.maintenanceLog.findMany({
    include: { extinguisher: true },
    orderBy: { maintenanceDate: 'desc' },
    take: limit,
  });
}
