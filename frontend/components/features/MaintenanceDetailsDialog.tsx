'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ClipboardList, Package, User, Wrench, X } from 'lucide-react';
import { api, UserRole } from '@/lib/api';
import { portalPath } from '@/lib/rbac';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MaintenanceExtinguisher {
  id: string;
  serialNumber: string;
  location: string;
  type?: string;
  status?: string;
}

export interface MaintenanceRecord {
  id: string;
  extinguisherId: string;
  extinguisher?: MaintenanceExtinguisher;
  inspectorId: string;
  inspectorEmail?: string | null;
  actionTaken: string;
  maintenanceDate: string;
  issuesIdentified?: string | null;
  notes?: string | null;
  recommendations?: string | null;
  createdAt?: string;
}

interface MaintenanceDetailsDialogProps {
  maintenanceId: string | null;
  role?: UserRole;
  onClose: () => void;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DetailRow({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3 py-2', className)}>
      {Icon && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium whitespace-pre-wrap break-words">{value}</div>
      </div>
    </div>
  );
}

export default function MaintenanceDetailsDialog({
  maintenanceId,
  role,
  onClose,
}: MaintenanceDetailsDialogProps) {
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!maintenanceId) {
      setRecord(null);
      return;
    }

    setLoading(true);
    setError('');
    api<{ data: MaintenanceRecord }>(`/maintenance/${maintenanceId}`)
      .then((res) => setRecord(res.data))
      .catch((err) => {
        setRecord(null);
        setError(err instanceof Error ? err.message : 'Failed to load maintenance record');
      })
      .finally(() => setLoading(false));
  }, [maintenanceId]);

  if (!maintenanceId) return null;

  const extinguisherHref =
    role && record?.extinguisher?.id
      ? portalPath(role, `/extinguishers/${record.extinguisher.id}`)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-details-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border bg-background p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="maintenance-details-title" className="text-lg font-semibold">
              Maintenance details
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Full record for this service log</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error && !record ? (
          <p className="mt-6 text-sm text-destructive">{error}</p>
        ) : record ? (
          <div className="mt-6 divide-y">
            <DetailRow
              label="Extinguisher"
              value={
                <span>
                  {record.extinguisher?.serialNumber ?? '—'}
                  {record.extinguisher?.location && (
                    <span className="block text-muted-foreground font-normal mt-0.5">
                      {record.extinguisher.location}
                    </span>
                  )}
                </span>
              }
              icon={Package}
            />
            <DetailRow label="Action taken" value={record.actionTaken} icon={Wrench} />
            <DetailRow label="Maintenance date" value={formatDate(record.maintenanceDate)} icon={Calendar} />
            <DetailRow
              label="Inspector"
              value={record.inspectorEmail ?? record.inspectorId}
              icon={User}
            />
            <DetailRow
              label="Issues identified"
              value={record.issuesIdentified?.trim() || 'None recorded'}
              icon={ClipboardList}
            />
            <DetailRow
              label="Notes"
              value={record.notes?.trim() || 'None recorded'}
              icon={ClipboardList}
            />
            <DetailRow
              label="Recommendations"
              value={record.recommendations?.trim() || 'None recorded'}
              icon={ClipboardList}
            />
            <DetailRow
              label="Logged at"
              value={formatDateTime(record.createdAt)}
              icon={Calendar}
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {extinguisherHref && (
            <Link href={extinguisherHref} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-full sm:w-auto' })}>
              View extinguisher
            </Link>
          )}
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
}
