/** Dashboard chart data helpers — derive chart series from live API payloads */

export interface AdminUser {
  id: string;
  role: string;
  createdAt: string;
}

export interface InventorySummary {
  total?: number;
  daily?: number;
  monthly?: number;
  yearly?: number;
  byStatus?: Record<string, number>;
  byType?: Record<string, number>;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  UNDER_MAINTENANCE: 'Under Maintenance',
  DECOMMISSIONED: 'Decommissioned',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'var(--chart-3)',
  EXPIRED: 'var(--chart-1)',
  UNDER_MAINTENANCE: 'var(--chart-2)',
  DECOMMISSIONED: 'var(--chart-4)',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--chart-1)',
  INSPECTOR: 'var(--chart-4)',
  USER: 'var(--chart-2)',
};

export function humanizeEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Last N months bucket keys in chronological order */
function monthBuckets(count: number): string[] {
  const buckets: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return buckets;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export function buildUserSignupTrend(users: AdminUser[], months = 6) {
  const keys = monthBuckets(months);
  const counts = Object.fromEntries(keys.map((k) => [k, 0]));

  for (const user of users) {
    if (!user.createdAt) continue;
    const d = new Date(user.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in counts) counts[key]++;
  }

  return keys.map((key) => ({
    month: formatMonthLabel(key),
    signups: counts[key],
  }));
}

export function buildUserRoleBreakdown(users: AdminUser[]) {
  const counts: Record<string, number> = {};
  for (const u of users) {
    counts[u.role] = (counts[u.role] ?? 0) + 1;
  }
  return Object.entries(counts).map(([role, count]) => ({
    role,
    label: humanizeEnum(role),
    count,
    fill: ROLE_COLORS[role] ?? 'var(--chart-5)',
  }));
}

export function buildExtinguisherStatusChart(byStatus: Record<string, number> = {}) {
  return Object.entries(byStatus).map(([status, count]) => ({
    status,
    label: STATUS_LABELS[status] ?? humanizeEnum(status),
    count,
    fill: STATUS_COLORS[status] ?? 'var(--chart-5)',
  }));
}

export function buildExtinguisherTypeChart(byType: Record<string, number> = {}) {
  return Object.entries(byType)
    .map(([type, count]) => ({
      type,
      label: humanizeEnum(type),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildInspectionSummaryChart(summary: Record<string, number> = {}) {
  const keys = ['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED'] as const;
  const colors: Record<string, string> = {
    PENDING: 'var(--chart-2)',
    COMPLETED: 'var(--chart-3)',
    OVERDUE: 'var(--chart-1)',
    CANCELLED: 'var(--chart-4)',
  };
  return keys
    .filter((k) => (summary[k] ?? 0) > 0 || summary.total === undefined)
    .map((key) => ({
      status: key,
      label: humanizeEnum(key),
      count: summary[key] ?? 0,
      fill: colors[key],
    }));
}

/** Count inspections by status from a flat list (inspector / user dashboards) */
export function summarizeInspectionStatuses(items: { status: string }[]) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}

/** Donut/bar data for inspection status mix (inspector / client dashboards) */
export function buildInspectionStatusChart(items: { status: string }[]) {
  return buildInspectionSummaryChart(summarizeInspectionStatuses(items)).filter((d) => d.count > 0);
}

/** @deprecated use buildInspectionStatusChart */
export function buildAssignedInspectionChart(items: { status: string }[]) {
  return buildInspectionStatusChart(items);
}

export function summarizeExtinguisherStatuses(items: { status: string }[]) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}

/** Donut data for extinguisher fleet status (client dashboard) */
export function buildExtinguisherStatusFromList(items: { status: string }[]) {
  return buildExtinguisherStatusChart(summarizeExtinguisherStatuses(items)).filter((d) => d.count > 0);
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Pending/overdue inspections grouped by day for the next 7 days */
export function buildUpcomingInspectionWeek(items: { scheduledDate: string; status: string }[]) {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const counts = buckets.map(() => 0);
  for (const item of items) {
    if (!['PENDING', 'OVERDUE'].includes(item.status)) continue;
    const scheduled = startOfDay(new Date(item.scheduledDate));
    const diffDays = Math.round((scheduled.getTime() - today.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) counts[diffDays]++;
  }

  return buckets.map((d, i) => ({
    day: i === 0 ? 'Today' : DAY_LABELS[d.getDay()],
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    count: counts[i],
  }));
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export { STATUS_LABELS, ROLE_COLORS };
