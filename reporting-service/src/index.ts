import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/env';
import { authenticate, requireRole, errorHandler } from './middleware/auth';
import * as ctrl from './controllers/report.controller';

const app = express();
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Reporting Service', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3003' }],
  },
  apis: [],
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'reporting-service' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const r = express.Router();
r.use(authenticate);

const adminOnly = requireRole('ADMIN');

r.get('/inventory/summary', adminOnly, ctrl.inventorySummary);
r.get('/maintenance/frequency', adminOnly, ctrl.maintenanceFrequency);
r.get('/compliance/status', adminOnly, ctrl.complianceStatus);
r.get('/inspections/pending', adminOnly, ctrl.pendingInspections);
r.get('/inspections/completed', adminOnly, ctrl.completedInspections);
r.get('/inspections/overdue', adminOnly, ctrl.overdueInspections);
r.get('/inspections/status', adminOnly, ctrl.inspectionStatus);
r.get('/compliance/expired', adminOnly, ctrl.expiredExtinguishers);
r.get('/compliance/upcoming', adminOnly, ctrl.upcomingExpirations);
r.get('/maintenance/history', adminOnly, ctrl.maintenanceHistory);
r.get('/maintenance/recent', adminOnly, ctrl.recentMaintenance);
app.use('/reports', r);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Reporting service running on port ${config.port}`);
});

export default app;
