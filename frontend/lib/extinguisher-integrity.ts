export interface IntegrityViolation {
  code: string;
  message: string;
}

export interface ExtinguisherIntegrity {
  canDelete: boolean;
  canUpdateIdentity: boolean;
  canDecommission: boolean;
  violations: IntegrityViolation[];
  activeInspections: Array<{
    id: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    createdByEmail?: string | null;
    assignedInspectorEmail?: string | null;
  }>;
}

export interface ExtinguisherIntegrityFlags {
  canDelete: boolean;
  hasActiveInspections: boolean;
  activeInspectionCount: number;
}

export function formatIntegrityMessage(violations: IntegrityViolation[]): string {
  return violations.map((v) => v.message).join(' ');
}

export function parseIntegrityFromApiError(errors: unknown): IntegrityViolation[] | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  const record = errors as Record<string, unknown>;
  if (Array.isArray(record.violations)) {
    return record.violations as IntegrityViolation[];
  }
  return undefined;
}
