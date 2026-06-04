import { Router, Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { authenticate, requireRole, requireServiceKey } from '../middleware/auth';
import { extinguisherSchema, updateExtinguisherSchema, inspectionSchema, maintenanceSchema } from '../validators/schemas';
import * as extController from '../controllers/extinguisher.controller';
import * as inspController from '../controllers/inspection.controller';
import * as maintController from '../controllers/maintenance.controller';

function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

const router = Router();

/**
 * @swagger
 * /extinguishers:
 *   get:
 *     tags: [Extinguishers]
 *     summary: List all fire extinguishers
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Extinguishers]
 *     summary: Register a new fire extinguisher
 *     description: Roles - ADMIN
 */
router.post('/', authenticate, requireRole('ADMIN'), validate(extinguisherSchema), extController.create);
router.get('/', authenticate, extController.list);
router.get('/:id/integrity', authenticate, requireRole('ADMIN'), extController.getIntegrity);
router.get('/:id', authenticate, extController.getById);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(updateExtinguisherSchema), extController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), extController.remove);
router.get('/:id/maintenance', authenticate, requireRole('ADMIN', 'INSPECTOR'), maintController.byExtinguisher);

export const internalRouter = Router();
internalRouter.use(requireServiceKey);
internalRouter.get('/', extController.internalList);

export default router;

export const inspectionRouter = Router();

/**
 * @swagger
 * /inspections:
 *   post:
 *     tags: [Inspections]
 *     summary: Schedule an inspection
 *     description: Sends email notification to assigned inspector
 *   get:
 *     tags: [Inspections]
 *     summary: List inspections filtered by role
 */
inspectionRouter.post('/', authenticate, requireRole('USER'), validate(inspectionSchema), inspController.schedule);
inspectionRouter.get('/', authenticate, inspController.list);
inspectionRouter.get('/:id', authenticate, inspController.getById);
inspectionRouter.patch('/:id/complete', authenticate, requireRole('INSPECTOR'), inspController.complete);
inspectionRouter.patch('/:id/cancel', authenticate, inspController.cancel);

export const internalInspectionRouter = Router();
internalInspectionRouter.use(requireServiceKey);
internalInspectionRouter.get('/status/:status', inspController.internalByStatus);

export const maintenanceRouter = Router();
maintenanceRouter.post('/', authenticate, requireRole('INSPECTOR'), validate(maintenanceSchema), maintController.create);
maintenanceRouter.get('/', authenticate, requireRole('ADMIN', 'INSPECTOR'), maintController.list);
maintenanceRouter.get('/:id', authenticate, requireRole('ADMIN', 'INSPECTOR'), maintController.getById);

export const internalMaintenanceRouter = Router();
internalMaintenanceRouter.use(requireServiceKey);
internalMaintenanceRouter.get('/', maintController.internalList);
internalMaintenanceRouter.get('/recent', maintController.internalRecent);
