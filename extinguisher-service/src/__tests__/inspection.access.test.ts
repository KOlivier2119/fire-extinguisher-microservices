import { canAccessInspection } from '../services/inspection.service';
import { JwtPayload } from '../config/env';

describe('Inspection access control', () => {
  const inspection = { createdById: 'user-1', assignedInspectorId: 'insp-1' };

  it('allows ADMIN to access any inspection', () => {
    const admin: JwtPayload = { userId: 'admin-1', email: 'a@t.com', role: 'ADMIN' };
    expect(canAccessInspection(inspection, admin)).toBe(true);
  });

  it('allows USER to access own created inspection', () => {
    const user: JwtPayload = { userId: 'user-1', email: 'u@t.com', role: 'USER' };
    expect(canAccessInspection(inspection, user)).toBe(true);
  });

  it('denies USER access to others inspections', () => {
    const user: JwtPayload = { userId: 'user-2', email: 'u2@t.com', role: 'USER' };
    expect(canAccessInspection(inspection, user)).toBe(false);
  });

  it('allows INSPECTOR to access assigned inspection', () => {
    const inspector: JwtPayload = { userId: 'insp-1', email: 'i@t.com', role: 'INSPECTOR' };
    expect(canAccessInspection(inspection, inspector)).toBe(true);
  });

  it('denies INSPECTOR access to unassigned inspection', () => {
    const inspector: JwtPayload = { userId: 'insp-2', email: 'i2@t.com', role: 'INSPECTOR' };
    expect(canAccessInspection(inspection, inspector)).toBe(false);
  });
});
