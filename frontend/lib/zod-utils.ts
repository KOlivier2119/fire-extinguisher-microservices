import { z } from 'zod';

/** Collect all validation messages per field (multiple lines when several rules fail) */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const buckets: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== 'string') continue;
    if (!buckets[key]) buckets[key] = [];
    if (!buckets[key].includes(issue.message)) {
      buckets[key].push(issue.message);
    }
  }

  return Object.fromEntries(
    Object.entries(buckets).map(([key, messages]) => [key, messages.join('\n')]),
  );
}

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Please check your input';
}
