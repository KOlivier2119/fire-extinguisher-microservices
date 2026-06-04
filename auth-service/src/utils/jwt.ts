import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import { Role } from '../generated/prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessExpires as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtRefreshExpires as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function getOtpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10);
  return d;
}

export function getResetSessionExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 15);
  return d;
}

export function getRefreshExpiry(): Date {
  const days = 7;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function getResetExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  return d;
}
