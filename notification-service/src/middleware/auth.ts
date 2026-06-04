import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export type UserRole = 'ADMIN' | 'INSPECTOR' | 'USER';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: UserRole };
}

export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-service-key'];
  if (key !== config.serviceApiKey) {
    return res.status(403).json({ success: false, message: 'Invalid service key' });
  }
  next();
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret) as AuthRequest['user'];
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
}
