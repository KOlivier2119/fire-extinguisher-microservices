import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as reports from '../services/report.service';
import { sendReport, parseFormat, ReportKind } from '../utils/export';

function handler(fetcher: () => Promise<unknown>, title: string, kind: ReportKind) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const data = await fetcher();
      return sendReport(res, { title, kind, data }, parseFormat(req.query.format));
    } catch (err) {
      if ((err as Error).message === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({ success: false, message: 'Extinguisher service unavailable' });
      }
      throw err;
    }
  };
}

export const inventorySummary = handler(
  () => reports.inventorySummary(),
  'Extinguisher Stock Report',
  'inventory',
);
export const pendingInspections = handler(
  () => reports.pendingInspections(),
  'Pending Inspections Report',
  'inspection-list',
);
export const completedInspections = handler(
  () => reports.completedInspections(),
  'Completed Inspections Report',
  'inspection-list',
);
export const overdueInspections = handler(
  () => reports.overdueInspections(),
  'Overdue Inspections Report',
  'inspection-list',
);
export const inspectionStatus = handler(
  () => reports.inspectionStatus(),
  'Inspection Status Report',
  'inspection-status',
);
export const expiredExtinguishers = handler(
  () => reports.expiredExtinguishers(),
  'Expired Extinguishers Report',
  'expired',
);
export const upcomingExpirations = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(String(req.query.days || '30'), 10);
    const data = await reports.upcomingExpirations(days);
    return sendReport(res, { title: 'Upcoming Expirations Report', kind: 'expired', data }, parseFormat(req.query.format));
  } catch (err) {
    if ((err as Error).message === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({ success: false, message: 'Extinguisher service unavailable' });
    }
    throw err;
  }
};
export const complianceStatus = handler(
  () => reports.complianceStatus(),
  'Compliance Status Report',
  'compliance',
);
export const maintenanceHistory = handler(
  () => reports.maintenanceHistory(),
  'Maintenance History Report',
  'maintenance',
);
export const maintenanceFrequency = handler(
  () => reports.maintenanceFrequency(),
  'Maintenance Frequency Report',
  'maintenance-frequency',
);
export const recentMaintenance = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(String(req.query.limit || '10'), 10);
    const data = await reports.recentMaintenance(limit);
    return sendReport(res, { title: 'Recent Maintenance Report', kind: 'maintenance', data: { items: data, total: Array.isArray(data) ? data.length : 0 } }, parseFormat(req.query.format));
  } catch (err) {
    if ((err as Error).message === 'SERVICE_UNAVAILABLE') {
      return res.status(503).json({ success: false, message: 'Extinguisher service unavailable' });
    }
    throw err;
  }
};
