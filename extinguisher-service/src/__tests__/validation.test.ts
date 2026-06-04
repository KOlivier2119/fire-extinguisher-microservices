describe('Extinguisher validation schemas', () => {
  const future = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  };

  const past = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const baseExtinguisher = () => ({
    serialNumber: 'FE-001',
    location: 'Lobby',
    type: 'CO2',
    size: 'LB_5',
    installationDate: past(),
    expiryDate: future(),
    status: 'ACTIVE',
  });

  it('rejects past expiry on create', () => {
    const { extinguisherSchema } = require('../validators/schemas');
    const result = extinguisherSchema.safeParse({
      ...baseExtinguisher(),
      expiryDate: past(),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i: { message: string }) =>
      i.message.includes('past'))).toBe(true);
  });

  it('rejects future installation date', () => {
    const { extinguisherSchema } = require('../validators/schemas');
    const result = extinguisherSchema.safeParse({
      ...baseExtinguisher(),
      installationDate: future(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects expiry before installation', () => {
    const { extinguisherSchema } = require('../validators/schemas');
    const result = extinguisherSchema.safeParse({
      ...baseExtinguisher(),
      installationDate: today(),
      expiryDate: past(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects future maintenance date', () => {
    const { maintenanceSchema } = require('../validators/schemas');
    const result = maintenanceSchema.safeParse({
      extinguisherId: '550e8400-e29b-41d4-a716-446655440000',
      actionTaken: 'Recharged unit',
      maintenanceDate: future(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects past inspection schedule', () => {
    const { inspectionSchema } = require('../validators/schemas');
    const result = inspectionSchema.safeParse({
      extinguisherId: '550e8400-e29b-41d4-a716-446655440000',
      scheduledDate: past(),
      scheduledTime: '09:00',
      assignedInspectorId: '550e8400-e29b-41d4-a716-446655440001',
      assignedInspectorEmail: 'inspector@example.com',
    });
    expect(result.success).toBe(false);
  });
});
