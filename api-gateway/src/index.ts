import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request } from 'express';
import swaggerUi from 'swagger-ui-express';
import axios from 'axios';
import { config } from './config/env';
import { authMiddleware } from './middleware/auth';
import { loadOpenApiSpec } from './lib/openapi';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

app.get('/health', async (_req, res) => {
  const services = [
    { name: 'auth', url: `${config.services.auth}/health` },
    { name: 'extinguisher', url: `${config.services.extinguisher}/health` },
    { name: 'reporting', url: `${config.services.reporting}/health` },
    { name: 'notification', url: `${config.services.notification}/health` },
  ];
  const status = await Promise.all(services.map(async s => {
    try {
      await axios.get(s.url, { timeout: 2000 });
      return { service: s.name, status: 'up' };
    } catch {
      return { service: s.name, status: 'down' };
    }
  }));
  res.json({ status: 'ok', gateway: 'up', services: status });
});

function writeJsonBody(proxyReq: import('http').ClientRequest, req: Request) {
  if (!req.body || req.method === 'GET' || req.method === 'HEAD') return;
  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader('Content-Type', 'application/json');
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
}

const serviceProxy = (target: string, servicePrefix: string) => createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: (path) => `${servicePrefix}${path}`,
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      writeJsonBody(proxyReq, req as Request);
    },
  },
});

const authProxy = serviceProxy(config.services.auth, '/auth');
const userProxy = serviceProxy(config.services.auth, '/users');
const extinguisherProxy = serviceProxy(config.services.extinguisher, '/extinguishers');
const inspectionProxy = serviceProxy(config.services.extinguisher, '/inspections');
const maintenanceProxy = serviceProxy(config.services.extinguisher, '/maintenance');
const reportProxy = serviceProxy(config.services.reporting, '/reports');
const notificationProxy = serviceProxy(config.services.notification, '/notifications');

const authRouter = express.Router();
authRouter.use(authLimiter);
authRouter.post('/logout', authMiddleware, authProxy);
authRouter.use(authProxy);
app.use('/api/auth', authRouter);

const userRouter = express.Router();
userRouter.post('/forgot-password', userProxy);
userRouter.post('/reset-password', userProxy);
userRouter.use(authMiddleware);
userRouter.use(userProxy);
app.use('/api/users', userRouter);

app.use('/api/extinguishers', authMiddleware, extinguisherProxy);
app.use('/api/inspections', authMiddleware, inspectionProxy);
app.use('/api/maintenance', authMiddleware, maintenanceProxy);
app.use('/api/reports', authMiddleware, reportProxy);
app.use('/api/notifications', authMiddleware, notificationProxy);

try {
  const spec = loadOpenApiSpec();
  const swaggerOptions = {
    customSiteTitle: 'TZW LTD FEMS API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
  };

  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(spec);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, swaggerOptions));
} catch (err) {
  const detail = err instanceof Error ? err.message : String(err);
  console.warn('Failed to load OpenAPI spec:', detail);
  app.get('/api/docs', (_req, res) => {
    res.json({
      message: 'Swagger docs unavailable — failed to load OpenAPI spec',
      error: detail,
      auth: `${config.services.auth}/docs`,
      extinguisher: `${config.services.extinguisher}/docs`,
      reporting: `${config.services.reporting}/docs`,
      notification: `${config.services.notification}/docs`,
    });
  });
}

app.listen(config.port, () => {
  console.log(`API Gateway running on port ${config.port}`);
});

export default app;
