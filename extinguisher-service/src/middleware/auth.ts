import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, JwtPayload } from '../config/env';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required', 401);
  }
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret) as JwtPayload;
    next();
  } catch {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 'Authentication required', 401);
    if (!roles.includes(req.user.role)) return sendError(res, 'Insufficient permissions', 403);
    next();
  };
}

export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-service-key'] !== config.serviceApiKey) {
    return sendError(res, 'Invalid service key', 403);
  }
  next();
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  sendError(res, err.message || 'Internal server error', 500);
}
