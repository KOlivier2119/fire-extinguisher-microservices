import { z } from 'zod';

const NAME_PATTERN = /^[\p{L}\s'-]+$/u;

export function createNameSchema(fieldLabel: string) {
  return z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      if (!val) {
        ctx.addIssue({ code: 'custom', message: `${fieldLabel} is required` });
        return;
      }
      if (val.length > 100) {
        ctx.addIssue({ code: 'custom', message: `${fieldLabel} must be 100 characters or less` });
      }
      if (!NAME_PATTERN.test(val)) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldLabel} may only contain letters, spaces, hyphens, and apostrophes`,
        });
      }
    });
}

export const firstNameSchema = createNameSchema('First name');
export const lastNameSchema = createNameSchema('Last name');
