import { z } from 'zod';
import {
  combineDateAndTime,
  isFutureDate,
  isPastDate,
  isValidBusinessTime,
  parseDateOnly,
  parseTime,
  startOfDay,
  BUSINESS_HOURS,
} from './date.utils';

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

function validateInstallationDate(value: string, ctx: z.RefinementCtx, path: string) {
  const date = parseDateOnly(value);
  if (!date) return;
  if (isFutureDate(date)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Installation date cannot be in the future',
      path: [path],
    });
  }
}

function validateExpiryAfterInstall(
  installationDate: string,
  expiryDate: string,
  ctx: z.RefinementCtx,
  path = 'expiryDate',
) {
  const install = parseDateOnly(installationDate);
  const expiry = parseDateOnly(expiryDate);
  if (!install || !expiry) return;
  if (startOfDay(expiry) <= startOfDay(install)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Expiry date must be after installation date',
      path: [path],
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
  status: extinguisherStatus.optional(),
});

/** New extinguisher — expiry must be today or in the future */
export const extinguisherSchema = extinguisherBase.superRefine((data, ctx) => {
  validateInstallationDate(data.installationDate, ctx, 'installationDate');

  const expiry = parseDateOnly(data.expiryDate);
  if (expiry && isPastDate(expiry)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Expiry date cannot be in the past when registering a new extinguisher',
      path: ['expiryDate'],
    });
  }

  validateExpiryAfterInstall(data.installationDate, data.expiryDate, ctx);
});

/** Update — allow past expiry for existing records; still enforce date ordering */
export const updateExtinguisherSchema = extinguisherBase.partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({ code: 'custom', message: 'At least one field is required' });
    return;
  }

  if (data.installationDate) {
    validateInstallationDate(data.installationDate, ctx, 'installationDate');
  }

  if (data.installationDate && data.expiryDate) {
    validateExpiryAfterInstall(data.installationDate, data.expiryDate, ctx);
  }
});

export const maintenanceSchema = z
  .object({
    extinguisherId: z.string().uuid('Select a valid extinguisher'),
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

export const inspectionSchema = z
  .object({
    extinguisherId: z.string().uuid('Select a valid extinguisher'),
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
    assignedInspectorId: z.string().uuid('Select a valid inspector'),
    assignedInspectorEmail: z.string().email('Inspector email is invalid'),
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
