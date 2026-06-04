import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/env';
import { requireServiceKey, authenticate, requireRole, errorHandler } from './middleware/auth';
import * as controller from './controllers/notification.controller';

const app = express();
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Notification Service', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3004' }],
  },
  apis: [],
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.post('/notifications/send', requireServiceKey, controller.send);
app.get('/notifications', authenticate, requireRole('ADMIN'), controller.list);
app.get('/notifications/:id', authenticate, requireRole('ADMIN'), controller.getById);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Notification service running on port ${config.port}`);
});

export default app;
