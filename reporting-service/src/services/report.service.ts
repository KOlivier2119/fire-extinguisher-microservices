import * as client from './extinguisher.client';
import { groupByPeriod } from '../utils/export';

export async function inventorySummary() {
  const extinguishers = await client.fetchExtinguishers();
  const periods = groupByPeriod(extinguishers as { createdAt?: string }[], 'createdAt');
  return {
    generatedAt: new Date().toISOString(),
    total: extinguishers.length,
    ...periods,
    byStatus: countBy(extinguishers, 'status'),
    byType: countBy(extinguishers, 'type'),
  };
}

export async function pendingInspections() {
  return client.fetchInspectionsByStatus('PENDING');
}

export async function completedInspections() {
  return client.fetchInspectionsByStatus('COMPLETED');
}

export async function overdueInspections() {
  return client.fetchInspectionsByStatus('OVERDUE');
}

export async function inspectionStatus() {
  const statuses = ['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED'] as const;
  const buckets = await Promise.all(
    statuses.map(async (status) => ({
      status,
      rows: await client.fetchInspectionsByStatus(status),
    })),
  );
  const summary = buckets.reduce<Record<string, number>>((acc, { status, rows }) => {
    acc[status] = rows.length;
    return acc;
  }, {});
  const total = buckets.reduce((sum, { rows }) => sum + rows.length, 0);
  const items = buckets.flatMap(({ status, rows }) =>
    rows.map((row) => ({ ...row, status })),
  );
  return {
    generatedAt: new Date().toISOString(),
    summary: { ...summary, total },
    items,
  };
}

export async function expiredExtinguishers() {
  const items = await client.fetchExtinguishers();
  const now = new Date();
  return items.filter(e => new Date(String(e.expiryDate)) < now || e.status === 'EXPIRED');
}

export async function upcomingExpirations(days = 30) {
  const items = await client.fetchExtinguishers();
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return items.filter(e => {
    const exp = new Date(String(e.expiryDate));
    return exp >= now && exp <= limit;
  });
}

export async function complianceStatus() {
  const items = await client.fetchExtinguishers();
  const total = items.length || 1;
  const expired = items.filter(e => e.status === 'EXPIRED').length;
  const active = items.filter(e => e.status === 'ACTIVE').length;
  const compliant = active;
  return {
    total,
    compliant,
    expired,
    complianceRate: Math.round((compliant / total) * 100),
    status: compliant / total >= 0.9 ? 'GOOD' : 'NEEDS_ATTENTION',
  };
}

export async function maintenanceHistory() {
  const items = await client.fetchMaintenance();
  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    items,
  };
}

export async function maintenanceFrequency() {
  const logs = await client.fetchMaintenance();
  const byMonth: Record<string, number> = {};
  for (const log of logs) {
    const d = new Date(String(log.maintenanceDate));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  }
  return { total: logs.length, byMonth };
}

export async function recentMaintenance(limit = 10) {
  return client.fetchRecentMaintenance(limit);
}

function countBy(items: Record<string, unknown>[], field: string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = String(item[field] || 'UNKNOWN');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
