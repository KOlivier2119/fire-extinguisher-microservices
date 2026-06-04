import { requireRole } from '../middleware/auth';
import { Response } from 'express';
import { JwtPayload } from '../config/env';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(data: unknown) { this.body = data; return this; },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('Reporting RBAC middleware', () => {
  it('denies USER role for admin-only routes', () => {
    const req = { user: { userId: '1', email: 'u@t.com', role: 'USER' } as JwtPayload };
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN')(req as never, res, next);
    expect(res.statusCode).toBe(403);
  });

  it('denies INSPECTOR role for admin-only routes', () => {
    const req = { user: { userId: '1', email: 'i@t.com', role: 'INSPECTOR' } as JwtPayload };
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN')(req as never, res, next);
    expect(res.statusCode).toBe(403);
  });

  it('allows ADMIN for admin-only routes', () => {
    const req = { user: { userId: '1', email: 'a@t.com', role: 'ADMIN' } as JwtPayload };
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN')(req as never, res, next);
    expect(next).toHaveBeenCalled();
  });
});
