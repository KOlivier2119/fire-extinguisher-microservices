'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Trash2 } from 'lucide-react';
import { api, ApiError, UserRole } from '@/lib/api';
import { canDeleteExtinguisher, canEditExtinguisher, portalPath } from '@/lib/rbac';
import {
  ExtinguisherIntegrity,
  formatIntegrityMessage,
  parseIntegrityFromApiError,
} from '@/lib/extinguisher-integrity';
import { useToast } from '@/lib/toast-context';
import { StatusBadge } from '@/lib/status-badges';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Inspection {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  assignedInspectorEmail?: string | null;
  createdByEmail?: string | null;
}

interface ExtinguisherDetailProps {
  role: UserRole;
  id: string;
}

export default function ExtinguisherDetail({ role, id }: ExtinguisherDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [integrity, setIntegrity] = useState<ExtinguisherIntegrity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [integrityOpen, setIntegrityOpen] = useState(false);
  const [integrityMessage, setIntegrityMessage] = useState('');
  const base = portalPath(role, '/extinguishers');
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    api<{ data: Record<string, unknown> }>(`/extinguishers/${id}`).then((r) => setItem(r.data));
    if (isAdmin) {
      api<{ data: ExtinguisherIntegrity }>(`/extinguishers/${id}/integrity`)
        .then((r) => setIntegrity(r.data))
        .catch(() => setIntegrity(null));
    }
  }, [id, isAdmin]);

  const openDeleteFlow = () => {
    if (integrity && !integrity.canDelete) {
      setIntegrityMessage(formatIntegrityMessage(integrity.violations));
      setIntegrityOpen(true);
      toast(formatIntegrityMessage(integrity.violations), 'warning');
      return;
    }
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/extinguishers/${id}`, { method: 'DELETE' });
      toast('Extinguisher deleted successfully.', 'success');
      router.push(base);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const violations = parseIntegrityFromApiError(err.payload);
        const message = violations ? formatIntegrityMessage(violations) : err.message;
        setIntegrityMessage(message);
        setIntegrityOpen(true);
        toast(message, 'warning');
        setDeleteOpen(false);
      } else {
        toast(err instanceof Error ? err.message : 'Delete failed', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!item) return <Skeleton className="h-64 w-full" />;

  const inspections = Array.isArray(item.inspections) ? (item.inspections as Inspection[]) : [];
  const activeInspections = inspections.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      <Link href={base} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        <ArrowLeft className="size-4" /> Back to list
      </Link>

      {integrity && !integrity.canDelete && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertDescription>
            {formatIntegrityMessage(integrity.violations)} Cancel or complete active inspections before making destructive changes.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight break-words">{String(item.serialNumber)}</h1>
          <p className="text-muted-foreground mt-1 break-words">{String(item.location)}</p>
        </div>
        <StatusBadge status={String(item.status)} className="self-start" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{String(item.type).replace(/_/g, ' ')}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span className="font-medium">{String(item.size).replace('LB_', '')} lb</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Installed</span><span>{new Date(String(item.installationDate)).toLocaleDateString()}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span>{new Date(String(item.expiryDate)).toLocaleDateString()}</span></div>
            {(canEditExtinguisher(role) || canDeleteExtinguisher(role)) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {canEditExtinguisher(role) && (
                    <Link href={`${base}/${id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                      Edit Extinguisher
                    </Link>
                  )}
                  {canDeleteExtinguisher(role) && (
                    <Button variant="destructive" size="sm" disabled={deleting} onClick={openDeleteFlow}>
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Inspections</CardTitle></CardHeader>
          <CardContent>
            {inspections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent inspections</p>
            ) : (
              <ul className="space-y-3">
                {inspections.map((inspection) => (
                  <li key={inspection.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {new Date(inspection.scheduledDate).toLocaleDateString()} at {inspection.scheduledTime}
                      </span>
                      <StatusBadge status={inspection.status} />
                    </div>
                    {inspection.assignedInspectorEmail && (
                      <p className="mt-1 text-muted-foreground">
                        Inspector: {inspection.assignedInspectorEmail}
                      </p>
                    )}
                    {inspection.createdByEmail && (
                      <p className="mt-1 text-muted-foreground">
                        Scheduled by: {inspection.createdByEmail}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {activeInspections.length > 0 && (
              <p className="mt-4 text-xs text-amber-700 dark:text-amber-400">
                {activeInspections.length} active inspection(s) protect this record from deletion.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete extinguisher?"
        description="This will permanently remove this extinguisher and its related records. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={integrityOpen}
        title="Action blocked — data integrity"
        description={integrityMessage}
        confirmLabel="OK"
        alertOnly
        onConfirm={() => setIntegrityOpen(false)}
        onCancel={() => setIntegrityOpen(false)}
      />
    </div>
  );
}
