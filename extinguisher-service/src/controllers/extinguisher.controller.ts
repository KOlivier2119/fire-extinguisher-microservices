import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { IntegrityError } from '../services/extinguisher-integrity';
import * as service from '../services/extinguisher.service';

function handleIntegrityError(res: Response, err: IntegrityError) {
  return sendError(res, err.message, 409, {
    code: err.code,
    violations: err.details?.violations,
    activeInspections: err.details?.activeInspections,
  });
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const item = await service.createExtinguisher(req.body);
    return sendSuccess(res, item, 'Fire extinguisher registered', 201);
  } catch (err) {
    if ((err as Error).message === 'DUPLICATE_SERIAL') return sendError(res, 'Serial number already exists', 409);
    throw err;
  }
}

export async function list(req: AuthRequest, res: Response) {
  const includeIntegrity = req.user?.role === 'ADMIN';
  return sendSuccess(res, await service.listExtinguishers(includeIntegrity));
}

export async function getById(req: AuthRequest, res: Response) {
  const item = await service.getExtinguisher(req.params.id as string);
  if (!item) return sendError(res, 'Not found', 404);
  return sendSuccess(res, item);
}

export async function getIntegrity(req: AuthRequest, res: Response) {
  try {
    const integrity = await service.getIntegrity(req.params.id as string);
    return sendSuccess(res, integrity);
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') return sendError(res, 'Not found', 404);
    throw err;
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const item = await service.updateExtinguisher(req.params.id as string, req.body);
    return sendSuccess(res, item, 'Updated successfully');
  } catch (err) {
    if (err instanceof IntegrityError) return handleIntegrityError(res, err);
    const msg = (err as Error).message;
    if (msg === 'NOT_FOUND') return sendError(res, 'Not found', 404);
    if (msg === 'DUPLICATE_SERIAL') return sendError(res, 'Serial number already exists', 409);
    if (msg === 'EXPIRY_BEFORE_INSTALL') {
      return sendError(res, 'Expiry date must be after installation date', 400, {
        expiryDate: ['Expiry date must be after installation date'],
      });
    }
    throw err;
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    await service.deleteExtinguisher(req.params.id as string);
    return sendSuccess(res, null, 'Deleted successfully');
  } catch (err) {
    if (err instanceof IntegrityError) return handleIntegrityError(res, err);
    if ((err as Error).message === 'NOT_FOUND') return sendError(res, 'Not found', 404);
    throw err;
  }
}

export async function internalList(_req: AuthRequest, res: Response) {
  return sendSuccess(res, await service.listExtinguishers());
}
