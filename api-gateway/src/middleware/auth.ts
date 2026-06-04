import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, publicPaths } from '../config/env';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const path = req.originalUrl.split('?')[0];
  if (publicPaths.some(p => path.startsWith(p))) return next();

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
