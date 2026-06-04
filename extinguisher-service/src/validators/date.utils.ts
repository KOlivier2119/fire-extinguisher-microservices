const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

export const BUSINESS_HOURS = { start: 6, end: 20 } as const;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function parseDateOnly(value: string): Date | null {
  if (!DATE_ONLY.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function parseTime(value: string): { hours: number; minutes: number } | null {
  if (!TIME_24H.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  const date = parseDateOnly(dateStr);
  const time = parseTime(timeStr);
  if (!date || !time) return null;
  date.setHours(time.hours, time.minutes, 0, 0);
  return date;
}

export function isPastDate(d: Date): boolean {
  return startOfDay(d) < startOfDay(new Date());
}

export function isFutureDate(d: Date): boolean {
  return startOfDay(d) > startOfDay(new Date());
}

export function isValidBusinessTime(timeStr: string): boolean {
  const time = parseTime(timeStr);
  if (!time) return false;
  const totalMinutes = time.hours * 60 + time.minutes;
  return totalMinutes >= BUSINESS_HOURS.start * 60 && totalMinutes <= BUSINESS_HOURS.end * 60;
}
