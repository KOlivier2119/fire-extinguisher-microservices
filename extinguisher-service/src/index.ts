import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/env';
import { errorHandler } from './middleware/auth';
import extinguisherRoutes, {
  inspectionRouter,
  maintenanceRouter,
  internalRouter,
  internalInspectionRouter,
  internalMaintenanceRouter,
} from './routes';
import { startCronJobs } from './jobs/cron';

const app = express();
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Extinguisher Service', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3002' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/index.ts'],
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'extinguisher-service' }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/extinguishers', extinguisherRoutes);
app.use('/inspections', inspectionRouter);
app.use('/maintenance', maintenanceRouter);
app.use('/internal/extinguishers', internalRouter);
app.use('/internal/inspections', internalInspectionRouter);
app.use('/internal/maintenance', internalMaintenanceRouter);

app.use(errorHandler);

startCronJobs();

app.listen(config.port, () => {
  console.log(`Extinguisher service running on port ${config.port}`);
});

export default app;
