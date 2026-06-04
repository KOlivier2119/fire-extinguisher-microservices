import { requireServiceKey, requireRole } from '../middleware/auth';
import { Request, Response } from 'express';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(data: unknown) { this.body = data; return this; },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('Notification middleware', () => {
  it('rejects missing service key', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn();
    requireServiceKey(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid service key', () => {
    const req = { headers: { 'x-service-key': 'internal-service-key' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();
    requireServiceKey(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('requireRole denies non-admin', () => {
    const req = { user: { userId: '1', email: 'u@t.com', role: 'USER' as const } };
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN')(req as never, res, next);
    expect(res.statusCode).toBe(403);
  });

  it('requireRole allows admin', () => {
    const req = { user: { userId: '1', email: 'a@t.com', role: 'ADMIN' as const } };
    const res = mockRes();
    const next = jest.fn();
    requireRole('ADMIN')(req as never, res, next);
    expect(next).toHaveBeenCalled();
  });
});
