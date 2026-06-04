import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import * as service from '../services/maintenance.service';

export async function create(req: AuthRequest, res: Response) {
  try {
    const log = await service.logMaintenance(req.body, req.user!);
    return sendSuccess(res, log, 'Maintenance logged', 201);
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') return sendError(res, 'Extinguisher not found', 404);
    const msg = (err as Error).message;
    if (msg === 'MAINTENANCE_DATE_FUTURE') {
      return sendError(res, 'Maintenance date cannot be in the future', 400, {
        maintenanceDate: ['Maintenance date cannot be in the future'],
      });
    }
    if (msg === 'MAINTENANCE_BEFORE_INSTALL') {
      return sendError(res, 'Maintenance date cannot be before installation date', 400, {
        maintenanceDate: ['Maintenance date cannot be before the extinguisher installation date'],
      });
    }
    throw err;
  }
}

export async function list(_req: AuthRequest, res: Response) {
  return sendSuccess(res, await service.listMaintenance());
}

export async function getById(req: AuthRequest, res: Response) {
  const item = await service.getMaintenance(req.params.id as string);
  if (!item) return sendError(res, 'Not found', 404);
  return sendSuccess(res, item);
}

export async function byExtinguisher(req: AuthRequest, res: Response) {
  return sendSuccess(res, await service.getMaintenanceByExtinguisher(req.params.id as string));
}

export async function internalList(_req: AuthRequest, res: Response) {
  return sendSuccess(res, await service.listMaintenance());
}

export async function internalRecent(req: AuthRequest, res: Response) {
  const limit = parseInt(req.query.limit as string || '10', 10);
  return sendSuccess(res, await service.getRecentMaintenance(limit));
}
