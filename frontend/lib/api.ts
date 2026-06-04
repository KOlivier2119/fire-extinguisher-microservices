const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export type UserRole = 'ADMIN' | 'INSPECTOR' | 'USER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;
  code?: string;
  payload?: unknown;

  constructor(
    message: string,
    status = 400,
    fieldErrors?: Record<string, string[]>,
    code?: string,
    payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
    this.payload = payload;
  }
}

function parseApiErrorPayload(errors: unknown): {
  fieldErrors?: Record<string, string[]>;
  code?: string;
} {
  if (!errors || typeof errors !== 'object') return {};
  const record = errors as Record<string, unknown>;
  const fieldErrors = normalizeFieldErrors(
    Object.fromEntries(
      Object.entries(record).filter(([key]) => !['code', 'violations', 'activeInspections'].includes(key)),
    ),
  );
  const code = typeof record.code === 'string' ? record.code : undefined;
  return { fieldErrors, code };
}

function normalizeFieldErrors(errors: unknown): Record<string, string[]> | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      result[key] = value.map(String);
    } else if (typeof value === 'string') {
      result[key] = [value];
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function fieldErrorsToRecord(fieldErrors?: Record<string, string[]>): Record<string, string> {
  if (!fieldErrors) return {};
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages.join('\n')]),
  );
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    if (!res.ok) {
      const { fieldErrors, code } = parseApiErrorPayload(json.errors);
      throw new ApiError(
        json.message || 'Request failed',
        res.status,
        fieldErrors,
        code,
        json.errors,
      );
    }
    return json as T;
  }

  if (!res.ok) throw new ApiError('Request failed', res.status);
  return res as unknown as T;
}

export async function downloadReport(path: string, filename: string, format: 'csv' | 'pdf') {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export { API_URL };
