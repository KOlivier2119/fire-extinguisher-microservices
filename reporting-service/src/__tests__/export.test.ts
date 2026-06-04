import { toCsvRows, parseFormat, buildBusinessCsvPreview } from '../utils/export';

describe('Report export utilities', () => {
  it('converts arrays to CSV rows', () => {
    const rows = toCsvRows([{ id: '1', name: 'test' }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('1');
  });

  it('converts objects to single CSV row', () => {
    const rows = toCsvRows({ total: 10, daily: 2, monthly: 5 });
    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe(10);
  });

  it('unwraps items array for CSV rows', () => {
    const rows = toCsvRows({ items: [{ id: '1' }, { id: '2' }] });
    expect(rows).toHaveLength(2);
  });

  it('wraps primitives in value field', () => {
    const rows = toCsvRows('hello');
    expect(rows[0].value).toBe('hello');
  });

  it('parses format query param', () => {
    expect(parseFormat('csv')).toBe('csv');
    expect(parseFormat('pdf')).toBe('pdf');
    expect(parseFormat(undefined)).toBe('json');
    expect(parseFormat('invalid')).toBe('json');
  });

  it('builds business CSV with structured table sections for inventory', () => {
    const csv = buildBusinessCsvPreview({
      title: 'Extinguisher Stock Report',
      kind: 'inventory',
      data: {
        generatedAt: '2025-06-03T10:00:00.000Z',
        total: 42,
        daily: 2,
        monthly: 8,
        yearly: 15,
        byStatus: { ACTIVE: 40, EXPIRED: 2 },
        byType: { CO2: 20, FOAM: 22 },
      },
    });

    const lines = csv.replace(/^\uFEFF/, '').split('\r\n');

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(lines.some((l) => l.startsWith('Report Information,'))).toBe(true);
    expect(lines).toContain('Field,Value');
    expect(lines).toContain('Metric,Value');
    expect(lines).toContain('Status,Count');
    expect(lines).toContain('Extinguisher Type,Count');
    expect(csv).toContain('TZW LTD');
    expect(csv).toContain('Total Extinguishers in Stock');
    expect(csv).toContain('ACTIVE,40');
    expect(csv).toContain('Confidential');
  });

  it('builds inspection status CSV with aligned detail table headers', () => {
    const csv = buildBusinessCsvPreview({
      title: 'Inspection Status Report',
      kind: 'inspection-status',
      data: {
        generatedAt: '2025-06-03T10:00:00.000Z',
        summary: { total: 1, PENDING: 1, COMPLETED: 0, OVERDUE: 0, CANCELLED: 0 },
        items: [{
          scheduledDate: '2025-06-10',
          scheduledTime: '09:00',
          status: 'PENDING',
          assignedInspectorEmail: 'inspector@tzw-ltd.com',
          extinguisher: { serialNumber: 'FE-001', location: 'Floor 1' },
        }],
      },
    });

    expect(csv).toContain('Serial Number,Location,Scheduled Date,Scheduled Time,Status,Assigned Inspector');
    expect(csv).toContain('FE-001,Floor 1');
    expect(csv).toContain('Metric,Value');
  });

  it('builds maintenance CSV with full column table matching UI', () => {
    const csv = buildBusinessCsvPreview({
      title: 'Maintenance History Report',
      kind: 'maintenance',
      data: {
        generatedAt: '2025-06-03T10:00:00.000Z',
        total: 1,
        items: [{
          actionTaken: 'Pressure check',
          maintenanceDate: '2025-06-01',
          inspectorEmail: 'inspector@tzw-ltd.com',
          issuesIdentified: 'Low pressure',
          recommendations: 'Recharge',
          notes: 'Completed on site',
          extinguisher: { serialNumber: 'FE-100', location: 'Warehouse' },
        }],
      },
    });

    expect(csv).toContain(
      'Extinguisher Serial,Location,Action Taken,Maintenance Date,Inspector,Issues Identified,Recommendations,Notes',
    );
    expect(csv).toContain('FE-100,Warehouse,Pressure check');
    expect(csv).toContain('inspector@tzw-ltd.com');
  });

  it('escapes commas and quotes in CSV cells', () => {
    const csv = buildBusinessCsvPreview({
      title: 'Inspection Status Report',
      kind: 'inspection-list',
      data: [{
        scheduledDate: '2025-06-10',
        scheduledTime: '09:00',
        status: 'PENDING',
        assignedInspectorEmail: 'inspector@tzw-ltd.com',
        extinguisher: { serialNumber: 'FE-002', location: 'Building A, Floor 2' },
      }],
    });

    expect(csv).toContain('"Building A, Floor 2"');
  });
});
