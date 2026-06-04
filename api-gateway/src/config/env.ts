import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3100',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    extinguisher: process.env.EXTINGUISHER_SERVICE_URL || 'http://localhost:3002',
    reporting: process.env.REPORTING_SERVICE_URL || 'http://localhost:3003',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  },
};

export const publicPaths = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-otp',
  '/api/auth/reset-password',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/docs',
  '/api/docs/openapi.json',
  '/health',
];
