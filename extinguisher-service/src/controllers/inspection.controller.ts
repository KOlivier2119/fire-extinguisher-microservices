import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import * as service from '../services/inspection.service';

export async function schedule(req: AuthRequest, res: Response) {
  try {
    const inspection = await service.scheduleInspection(req.body, req.user!);
    return sendSuccess(res, inspection, 'Inspection scheduled', 201);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return sendError(res, 'Extinguisher not found', 404);
    if (msg === 'EXTINGUISHER_DECOMMISSIONED') {
      return sendError(res, 'Cannot schedule inspection for a decommissioned extinguisher', 400, {
        extinguisherId: ['Cannot schedule inspection for a decommissioned extinguisher'],
      });
    }
    if (msg === 'SCHEDULED_IN_PAST') {
      return sendError(res, 'Inspection must be scheduled for a future date and time', 400, {
        scheduledDate: ['Inspection must be scheduled for a future date and time'],
      });
    }
    throw err;
  }
}

export async function list(req: AuthRequest, res: Response) {
  const status = req.query.status as string | undefined;
  return sendSuccess(res, await service.listInspections(req.user!, status));
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const item = await service.getInspection(req.params.id as string, req.user!);
    return sendSuccess(res, item);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return sendError(res, 'Not found', 404);
    if (msg === 'FORBIDDEN') return sendError(res, 'Insufficient permissions', 403);
    throw err;
  }
}

export async function complete(req: AuthRequest, res: Response) {
  try {
    const item = await service.completeInspection(req.params.id as string, req.user!);
    return sendSuccess(res, item, 'Inspection completed');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return sendError(res, 'Not found', 404);
    if (msg === 'FORBIDDEN') return sendError(res, 'Insufficient permissions', 403);
    throw err;
  }
}

export async function cancel(req: AuthRequest, res: Response) {
  try {
    const item = await service.cancelInspection(req.params.id as string, req.user!);
    return sendSuccess(res, item, 'Inspection cancelled');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return sendError(res, 'Not found', 404);
    if (msg === 'FORBIDDEN') return sendError(res, 'Insufficient permissions', 403);
    throw err;
  }
}

export async function internalByStatus(req: AuthRequest, res: Response) {
  const status = req.params.status as 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  return sendSuccess(res, await service.getInspectionsByStatus(status));
}
