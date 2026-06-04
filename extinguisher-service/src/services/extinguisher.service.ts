import { prisma } from '../lib/prisma';
import { isExpired, startOfDay } from '../utils/response';
import { parseDateOnly } from '../validators/date.utils';
import { ExtinguisherStatus } from '../generated/prisma/client';
import {
  assertCanDeleteExtinguisher,
  assertCanUpdateExtinguisher,
  attachIntegrityFlags,
  getExtinguisherIntegrity,
} from './extinguisher-integrity';

function normalizeStatus<T extends { expiryDate: Date; status: ExtinguisherStatus }>(ext: T): T {
  if (isExpired(ext.expiryDate) && ext.status !== 'DECOMMISSIONED') {
    return { ...ext, status: 'EXPIRED' as ExtinguisherStatus };
  }
  return ext;
}

export async function createExtinguisher(data: {
  serialNumber: string;
  location: string;
  type: 'WATER' | 'CO2' | 'FOAM' | 'DRY_CHEMICAL';
  size: 'LB_1_5' | 'LB_5' | 'LB_9' | 'LB_12';
  installationDate: string;
  expiryDate: string;
  status?: ExtinguisherStatus;
}) {
  const existing = await prisma.fireExtinguisher.findUnique({ where: { serialNumber: data.serialNumber } });
  if (existing) throw new Error('DUPLICATE_SERIAL');

  const expiryDate = parseDateOnly(data.expiryDate);
  if (!expiryDate) throw new Error('INVALID_EXPIRY_DATE');
  const installationDate = parseDateOnly(data.installationDate);
  if (!installationDate) throw new Error('INVALID_INSTALLATION_DATE');

  let status = data.status || 'ACTIVE';
  if (isExpired(expiryDate)) status = 'EXPIRED';

  return prisma.fireExtinguisher.create({
    data: {
      serialNumber: data.serialNumber,
      location: data.location,
      type: data.type,
      size: data.size,
      installationDate,
      expiryDate,
      status,
    },
  });
}

export async function listExtinguishers(includeIntegrity = false) {
  const items = await prisma.fireExtinguisher.findMany({ orderBy: { createdAt: 'desc' } });
  const normalized = items.map(normalizeStatus);
  if (!includeIntegrity) return normalized;
  return attachIntegrityFlags(normalized);
}

export async function getExtinguisher(id: string) {
  const item = await prisma.fireExtinguisher.findUnique({
    where: { id },
    include: {
      inspections: { orderBy: { scheduledDate: 'desc' }, take: 10 },
      maintenanceLogs: { orderBy: { maintenanceDate: 'desc' }, take: 10 },
    },
  });
  if (!item) return null;
  return { ...item, ...normalizeStatus(item) };
}

export async function updateExtinguisher(id: string, data: Partial<{
  serialNumber: string;
  location: string;
  type: 'WATER' | 'CO2' | 'FOAM' | 'DRY_CHEMICAL';
  size: 'LB_1_5' | 'LB_5' | 'LB_9' | 'LB_12';
  installationDate: string;
  expiryDate: string;
  status: ExtinguisherStatus;
}>) {
  if (data.serialNumber) {
    const dup = await prisma.fireExtinguisher.findFirst({ where: { serialNumber: data.serialNumber, NOT: { id } } });
    if (dup) throw new Error('DUPLICATE_SERIAL');
  }

  const existing = await prisma.fireExtinguisher.findUnique({ where: { id } });
  if (!existing) throw new Error('NOT_FOUND');

  const installDate = data.installationDate
    ? parseDateOnly(data.installationDate)
    : existing.installationDate;
  const expiryDateParsed = data.expiryDate ? parseDateOnly(data.expiryDate) : null;

  if (installDate && expiryDateParsed && startOfDay(expiryDateParsed) <= startOfDay(installDate)) {
    throw new Error('EXPIRY_BEFORE_INSTALL');
  }

  await assertCanUpdateExtinguisher(id, existing, data);

  const updateData: Record<string, unknown> = { ...data };
  if (data.installationDate) {
    const parsed = parseDateOnly(data.installationDate);
    if (!parsed) throw new Error('INVALID_INSTALLATION_DATE');
    updateData.installationDate = parsed;
  }
  if (data.expiryDate) {
    const parsed = parseDateOnly(data.expiryDate);
    if (!parsed) throw new Error('INVALID_EXPIRY_DATE');
    updateData.expiryDate = parsed;
    if (isExpired(parsed)) updateData.status = 'EXPIRED';
  }

  return prisma.fireExtinguisher.update({ where: { id }, data: updateData });
}

export async function deleteExtinguisher(id: string) {
  const existing = await prisma.fireExtinguisher.findUnique({ where: { id } });
  if (!existing) throw new Error('NOT_FOUND');
  await assertCanDeleteExtinguisher(id, existing.status);
  return prisma.fireExtinguisher.delete({ where: { id } });
}

export async function getIntegrity(id: string) {
  const existing = await prisma.fireExtinguisher.findUnique({ where: { id } });
  if (!existing) throw new Error('NOT_FOUND');
  return getExtinguisherIntegrity(id, existing.status);
}

export async function syncExpiredStatus() {
  await prisma.fireExtinguisher.updateMany({
    where: { expiryDate: { lt: new Date() }, status: { notIn: ['DECOMMISSIONED', 'EXPIRED'] } },
    data: { status: 'EXPIRED' },
  });
}
