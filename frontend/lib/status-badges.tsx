import { Badge } from '@/components/ui/badge';

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'info' | 'secondary' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  UNDER_MAINTENANCE: { label: 'Maintenance', variant: 'warning' },
  DECOMMISSIONED: { label: 'Decommissioned', variant: 'secondary' },
  PENDING: { label: 'Pending', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
  ADMIN: { label: 'Admin', variant: 'destructive' },
  INSPECTOR: { label: 'Inspector', variant: 'info' },
  USER: { label: 'User', variant: 'secondary' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const config = STATUS_MAP[role] ?? { label: role, variant: 'secondary' as const };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
