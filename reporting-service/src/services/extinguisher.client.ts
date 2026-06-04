import axios from 'axios';
import { config } from '../config/env';

const client = axios.create({
  baseURL: config.extinguisherServiceUrl,
  headers: { 'X-Service-Key': config.serviceApiKey },
});

async function get<T>(path: string): Promise<T> {
  try {
    const res = await client.get(path);
    return res.data.data;
  } catch (err) {
    console.error('Extinguisher service request failed:', err);
    throw new Error('SERVICE_UNAVAILABLE');
  }
}

export async function fetchExtinguishers() {
  return get<Record<string, unknown>[]>('/internal/extinguishers');
}

export async function fetchInspectionsByStatus(status: string) {
  return get<Record<string, unknown>[]>(`/internal/inspections/status/${status}`);
}

export async function fetchMaintenance() {
  return get<Record<string, unknown>[]>('/internal/maintenance');
}

export async function fetchRecentMaintenance(limit: number) {
  return get<Record<string, unknown>[]>(`/internal/maintenance/recent?limit=${limit}`);
}
