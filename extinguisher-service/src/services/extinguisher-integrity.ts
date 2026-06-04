import { prisma } from '../lib/prisma';
import { ExtinguisherStatus, InspectionStatus } from '../generated/prisma/client';

const ACTIVE_INSPECTION_STATUSES: InspectionStatus[] = ['PENDING', 'OVERDUE'];

export class IntegrityError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'IntegrityError';
    this.code = code;
    this.details = details;
  }
}

export interface IntegrityViolation {
  code: string;
  message: string;
}

export interface ActiveInspectionSummary {
  id: string;
  status: InspectionStatus;
  scheduledDate: Date;
  scheduledTime: string;
  createdByEmail: string | null;
  assignedInspectorEmail: string | null;
}

export interface ExtinguisherIntegrity {
  canDelete: boolean;
  canUpdateIdentity: boolean;
  canDecommission: boolean;
  violations: IntegrityViolation[];
  activeInspections: ActiveInspectionSummary[];
}

async function getActiveInspections(extinguisherId: string): Promise<ActiveInspectionSummary[]> {
  return prisma.inspection.findMany({
    where: {
      extinguisherId,
      status: { in: ACTIVE_INSPECTION_STATUSES },
    },
    orderBy: { scheduledDate: 'asc' },
    select: {
      id: true,
      status: true,
      scheduledDate: true,
      scheduledTime: true,
      createdByEmail: true,
      assignedInspectorEmail: true,
    },
  });
}

function buildDeleteViolations(
  status: ExtinguisherStatus,
  activeInspections: ActiveInspectionSummary[],
): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];

  if (activeInspections.length > 0) {
    const schedulers = [...new Set(activeInspections.map((i) => i.createdByEmail).filter(Boolean))];
    violations.push({
      code: 'ACTIVE_INSPECTIONS',
      message: `This extinguisher has ${activeInspections.length} active inspection(s) scheduled by a user. Cancel or complete them before deleting.`,
    });
    if (schedulers.length > 0) {
      violations.push({
        code: 'ACTIVE_INSPECTIONS',
        message: `Scheduled by: ${schedulers.join(', ')}`,
      });
    }
  }

  if (status === 'UNDER_MAINTENANCE') {
    violations.push({
      code: 'UNDER_MAINTENANCE',
      message: 'This extinguisher is under maintenance. Resolve maintenance before deleting.',
    });
  }

  return violations;
}

function buildUpdateViolations(
  status: ExtinguisherStatus,
  activeInspections: ActiveInspectionSummary[],
  changes: { serialNumber?: string; location?: string; nextStatus?: ExtinguisherStatus },
  existing: { serialNumber: string; location: string; status: ExtinguisherStatus },
): IntegrityViolation[] {
  const violations: IntegrityViolation[] = [];
  const hasActive = activeInspections.length > 0;

  if (hasActive) {
    if (changes.serialNumber && changes.serialNumber !== existing.serialNumber) {
      violations.push({
        code: 'IDENTITY_CHANGE_BLOCKED',
        message: 'Serial number cannot be changed while inspections are pending or overdue.',
      });
    }
    if (changes.location && changes.location !== existing.location) {
      violations.push({
        code: 'IDENTITY_CHANGE_BLOCKED',
        message: 'Location cannot be changed while inspections are scheduled for this extinguisher.',
      });
    }
    if (changes.nextStatus === 'DECOMMISSIONED') {
      violations.push({
        code: 'DECOMMISSION_BLOCKED',
        message: 'Cannot decommission while active inspections exist. Cancel inspections first.',
      });
    }
  }

  if (status === 'UNDER_MAINTENANCE' && changes.nextStatus === 'DECOMMISSIONED') {
    violations.push({
      code: 'UNDER_MAINTENANCE',
      message: 'Cannot decommission an extinguisher that is under maintenance.',
    });
  }

  return violations;
}

export async function getExtinguisherIntegrity(
  extinguisherId: string,
  status: ExtinguisherStatus,
): Promise<ExtinguisherIntegrity> {
  const activeInspections = await getActiveInspections(extinguisherId);
  const deleteViolations = buildDeleteViolations(status, activeInspections);

  const violations: IntegrityViolation[] = [...deleteViolations];
  if (activeInspections.length > 0) {
    violations.push({
      code: 'IDENTITY_CHANGE_BLOCKED',
      message: 'Serial number and location are locked while inspections are active.',
    });
  }

  return {
    canDelete: deleteViolations.length === 0,
    canUpdateIdentity: activeInspections.length === 0,
    canDecommission: activeInspections.length === 0 && status !== 'UNDER_MAINTENANCE',
    violations,
    activeInspections,
  };
}

export async function assertCanDeleteExtinguisher(
  extinguisherId: string,
  status: ExtinguisherStatus,
): Promise<void> {
  const integrity = await getExtinguisherIntegrity(extinguisherId, status);
  if (!integrity.canDelete) {
    const primary = integrity.violations[0];
    throw new IntegrityError(
      primary?.code ?? 'INTEGRITY_VIOLATION',
      primary?.message ?? 'This action would violate data integrity.',
      { violations: integrity.violations, activeInspections: integrity.activeInspections },
    );
  }
}

export async function assertCanUpdateExtinguisher(
  extinguisherId: string,
  existing: { serialNumber: string; location: string; status: ExtinguisherStatus },
  data: Partial<{ serialNumber: string; location: string; status: ExtinguisherStatus }>,
): Promise<void> {
  const activeInspections = await getActiveInspections(extinguisherId);
  const violations = buildUpdateViolations(
    existing.status,
    activeInspections,
    {
      serialNumber: data.serialNumber,
      location: data.location,
      nextStatus: data.status,
    },
    existing,
  );

  if (violations.length > 0) {
    throw new IntegrityError(
      violations[0].code,
      violations[0].message,
      { violations, activeInspections },
    );
  }
}

export async function attachIntegrityFlags<T extends { id: string; status: ExtinguisherStatus }>(
  items: T[],
): Promise<Array<T & { integrity: Pick<ExtinguisherIntegrity, 'canDelete' | 'activeInspections'> & { activeInspectionCount: number; hasActiveInspections: boolean } }>> {
  if (items.length === 0) return [];

  const counts = await prisma.inspection.groupBy({
    by: ['extinguisherId'],
    where: {
      extinguisherId: { in: items.map((i) => i.id) },
      status: { in: ACTIVE_INSPECTION_STATUSES },
    },
    _count: { _all: true },
  });

  const countMap = new Map(counts.map((c) => [c.extinguisherId, c._count._all]));

  return items.map((item) => {
    const activeInspectionCount = countMap.get(item.id) ?? 0;
    const hasActiveInspections = activeInspectionCount > 0;
    const canDelete = item.status !== 'UNDER_MAINTENANCE' && !hasActiveInspections;

    return {
      ...item,
      integrity: {
        canDelete,
        hasActiveInspections,
        activeInspectionCount,
        activeInspections: [],
      },
    };
  });
}
