import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, JwtPayload } from '../config/env';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret) as JwtPayload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}

export function errorHandler(err: Error, req: AuthRequest, res: Response, next: NextFunction) {
  if (err.message === 'SERVICE_UNAVAILABLE') {
    return res.status(503).json({ success: false, message: 'Extinguisher service unavailable' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
}
