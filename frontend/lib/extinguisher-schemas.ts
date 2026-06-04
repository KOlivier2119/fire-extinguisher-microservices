import { z } from 'zod';
import {
  BUSINESS_HOURS,
  combineDateAndTime,
  isFutureDate,
  isPastDate,
  isValidBusinessTime,
  parseDateOnly,
  parseTime,
  startOfDay,
} from './date-utils';

const extinguisherType = z.enum(['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL']);
const extinguisherSize = z.enum(['LB_1_5', 'LB_5', 'LB_9', 'LB_12']);
const extinguisherStatus = z.enum(['ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']);

function dateOnlyField(label: string) {
  return z.string().superRefine((val, ctx) => {
    if (!val) {
      ctx.addIssue({ code: 'custom', message: `${label} is required` });
      return;
    }
    if (!parseDateOnly(val)) {
      ctx.addIssue({ code: 'custom', message: `${label} must be a valid date` });
    }
  });
}

function validateInstallationDate(value: string, ctx: z.RefinementCtx) {
  const date = parseDateOnly(value);
  if (!date) return;
  if (isFutureDate(date)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Installation date cannot be in the future',
      path: ['installationDate'],
    });
  }
}

function validateExpiryAfterInstall(installationDate: string, expiryDate: string, ctx: z.RefinementCtx) {
  const install = parseDateOnly(installationDate);
  const expiry = parseDateOnly(expiryDate);
  if (!install || !expiry) return;
  if (startOfDay(expiry) <= startOfDay(install)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Expiry date must be after installation date',
      path: ['expiryDate'],
    });
  }
}

const extinguisherBase = z.object({
  serialNumber: z.string().trim().min(1, 'Serial number is required').max(100),
  location: z.string().trim().min(1, 'Location is required').max(255),
  type: extinguisherType,
  size: extinguisherSize,
  installationDate: dateOnlyField('Installation date'),
  expiryDate: dateOnlyField('Expiry date'),
  status: extinguisherStatus,
});

export const createExtinguisherSchema = extinguisherBase.superRefine((data, ctx) => {
  validateInstallationDate(data.installationDate, ctx);

  const expiry = parseDateOnly(data.expiryDate);
  if (expiry && isPastDate(expiry)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Expiry date cannot be in the past',
      path: ['expiryDate'],
    });
  }

  validateExpiryAfterInstall(data.installationDate, data.expiryDate, ctx);
});

export const updateExtinguisherSchema = extinguisherBase.superRefine((data, ctx) => {
  validateInstallationDate(data.installationDate, ctx);
  validateExpiryAfterInstall(data.installationDate, data.expiryDate, ctx);
});

export const maintenanceSchema = z
  .object({
    extinguisherId: z.string().min(1, 'Extinguisher is required'),
    actionTaken: z.string().trim().min(1, 'Action taken is required').max(500),
    maintenanceDate: dateOnlyField('Maintenance date'),
    issuesIdentified: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional(),
    recommendations: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    const date = parseDateOnly(data.maintenanceDate);
    if (!date) return;
    if (isFutureDate(date)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Maintenance date cannot be in the future',
        path: ['maintenanceDate'],
      });
    }
  });

export function maintenanceSchemaWithInstallDate(installationDate?: string) {
  return maintenanceSchema.superRefine((data, ctx) => {
    if (!installationDate) return;
    const maintenance = parseDateOnly(data.maintenanceDate);
    const install = parseDateOnly(installationDate.slice(0, 10));
    if (!maintenance || !install) return;
    if (startOfDay(maintenance) < startOfDay(install)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Maintenance date cannot be before the extinguisher installation date',
        path: ['maintenanceDate'],
      });
    }
  });
}

export const inspectionSchema = z
  .object({
    extinguisherId: z.string().min(1, 'Extinguisher is required'),
    scheduledDate: dateOnlyField('Scheduled date'),
    scheduledTime: z.string().superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({ code: 'custom', message: 'Scheduled time is required' });
        return;
      }
      if (!parseTime(val)) {
        ctx.addIssue({ code: 'custom', message: 'Scheduled time must be in HH:MM format' });
        return;
      }
      if (!isValidBusinessTime(val)) {
        ctx.addIssue({
          code: 'custom',
          message: `Scheduled time must be between ${String(BUSINESS_HOURS.start).padStart(2, '0')}:00 and ${String(BUSINESS_HOURS.end).padStart(2, '0')}:00`,
        });
      }
    }),
    assignedInspectorId: z.string().min(1, 'Inspector is required'),
    assignedInspectorEmail: z.string().min(1, 'Inspector email is required'),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    const scheduled = combineDateAndTime(data.scheduledDate, data.scheduledTime);
    if (!scheduled) return;

    if (scheduled.getTime() <= Date.now()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Inspection must be scheduled for a future date and time',
        path: ['scheduledDate'],
      });
    }
  });
