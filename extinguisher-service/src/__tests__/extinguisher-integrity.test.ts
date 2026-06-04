import { IntegrityError, assertCanDeleteExtinguisher, assertCanUpdateExtinguisher, getExtinguisherIntegrity } from '../services/extinguisher-integrity';

const mockInspectionFindMany = jest.fn();
const mockInspectionGroupBy = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    inspection: {
      findMany: (...args: unknown[]) => mockInspectionFindMany(...args),
      groupBy: (...args: unknown[]) => mockInspectionGroupBy(...args),
    },
  },
}));

describe('Extinguisher integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows delete when no active inspections', async () => {
    mockInspectionFindMany.mockResolvedValue([]);
    const integrity = await getExtinguisherIntegrity('ext-1', 'ACTIVE');
    expect(integrity.canDelete).toBe(true);
    await expect(assertCanDeleteExtinguisher('ext-1', 'ACTIVE')).resolves.toBeUndefined();
  });

  it('blocks delete when user-scheduled inspections are active', async () => {
    mockInspectionFindMany.mockResolvedValue([
      {
        id: 'insp-1',
        status: 'PENDING',
        scheduledDate: new Date('2026-06-10'),
        scheduledTime: '10:00',
        createdByEmail: 'user@example.com',
        assignedInspectorEmail: 'inspector@example.com',
      },
    ]);

    const integrity = await getExtinguisherIntegrity('ext-1', 'ACTIVE');
    expect(integrity.canDelete).toBe(false);
    expect(integrity.violations.some((v) => v.code === 'ACTIVE_INSPECTIONS')).toBe(true);

    await expect(assertCanDeleteExtinguisher('ext-1', 'ACTIVE')).rejects.toBeInstanceOf(IntegrityError);
  });

  it('blocks delete when under maintenance', async () => {
    mockInspectionFindMany.mockResolvedValue([]);
    const integrity = await getExtinguisherIntegrity('ext-1', 'UNDER_MAINTENANCE');
    expect(integrity.canDelete).toBe(false);
    expect(integrity.violations.some((v) => v.code === 'UNDER_MAINTENANCE')).toBe(true);
  });

  it('blocks serial number change with active inspections', async () => {
    mockInspectionFindMany.mockResolvedValue([
      { id: 'insp-1', status: 'OVERDUE', scheduledDate: new Date(), scheduledTime: '09:00', createdByEmail: 'user@example.com', assignedInspectorEmail: null },
    ]);

    await expect(
      assertCanUpdateExtinguisher(
        'ext-1',
        { serialNumber: 'SN-001', location: 'Floor 1', status: 'ACTIVE' },
        { serialNumber: 'SN-002' },
      ),
    ).rejects.toMatchObject({ code: 'IDENTITY_CHANGE_BLOCKED' });
  });

  it('blocks decommission with pending inspections', async () => {
    mockInspectionFindMany.mockResolvedValue([
      { id: 'insp-1', status: 'PENDING', scheduledDate: new Date(), scheduledTime: '09:00', createdByEmail: 'user@example.com', assignedInspectorEmail: null },
    ]);

    await expect(
      assertCanUpdateExtinguisher(
        'ext-1',
        { serialNumber: 'SN-001', location: 'Floor 1', status: 'ACTIVE' },
        { status: 'DECOMMISSIONED' },
      ),
    ).rejects.toMatchObject({ code: 'DECOMMISSION_BLOCKED' });
  });
});
