import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  serviceApiKey: process.env.SERVICE_API_KEY || 'internal-service-key',
};

export type UserRole = 'ADMIN' | 'INSPECTOR' | 'USER';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
