'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, UserRole } from '@/lib/api';
import { portalPath } from '@/lib/rbac';
import { todayISO } from '@/lib/date-utils';
import { createExtinguisherSchema, updateExtinguisherSchema } from '@/lib/extinguisher-schemas';
import { zodFieldErrors } from '@/lib/zod-utils';
import {
  ExtinguisherIntegrity,
  formatIntegrityMessage,
  parseIntegrityFromApiError,
} from '@/lib/extinguisher-integrity';
import { useToast } from '@/lib/toast-context';
import FormField, { FieldError } from '@/components/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';

const TYPES = ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'];
const SIZES = ['LB_1_5', 'LB_5', 'LB_9', 'LB_12'];
const STATUSES = ['ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'];

interface ExtinguisherFormProps {
  role: UserRole;
  id?: string;
}

export default function ExtinguisherForm({ role, id }: ExtinguisherFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const listPath = portalPath(role, '/extinguishers');
  const [form, setForm] = useState({
    serialNumber: '', location: '', type: 'CO2', size: 'LB_5',
    installationDate: '', expiryDate: '', status: 'ACTIVE',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(!isEdit);
  const [integrity, setIntegrity] = useState<ExtinguisherIntegrity | null>(null);
  const [integrityOpen, setIntegrityOpen] = useState(false);
  const [integrityMessage, setIntegrityMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    api<{ data: Record<string, string> }>(`/extinguishers/${id}`).then((r) => {
      const d = r.data;
      setForm({
        serialNumber: d.serialNumber,
        location: d.location,
        type: d.type,
        size: d.size,
        installationDate: d.installationDate?.slice(0, 10),
        expiryDate: d.expiryDate?.slice(0, 10),
        status: d.status,
      });
      setLoaded(true);
    });
    if (role === 'ADMIN') {
      api<{ data: ExtinguisherIntegrity }>(`/extinguishers/${id}/integrity`)
        .then((r) => setIntegrity(r.data))
        .catch(() => setIntegrity(null));
    }
  }, [id, role]);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const showIntegrityBlocked = (message: string) => {
    setIntegrityMessage(message);
    setIntegrityOpen(true);
    toast(message, 'warning');
  };

  if (isEdit && !loaded) return <Skeleton className="h-96 w-full max-w-lg" />;

  const identityLocked = Boolean(integrity && !integrity.canUpdateIdentity);
  const decommissionBlocked = Boolean(integrity && !integrity.canDecommission);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const schema = isEdit ? updateExtinguisherSchema : createExtinguisherSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    try {
      if (isEdit) {
        await api(`/extinguishers/${id}`, { method: 'PUT', body: JSON.stringify(parsed.data) });
        toast('Extinguisher updated successfully.', 'success');
        router.push(`${listPath}/${id}`);
      } else {
        await api('/extinguishers', { method: 'POST', body: JSON.stringify(parsed.data) });
        toast('Extinguisher registered successfully.', 'success');
        router.push(listPath);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const violations = parseIntegrityFromApiError(err.payload);
        showIntegrityBlocked(violations ? formatIntegrityMessage(violations) : err.message);
      } else if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(fieldErrorsFromApi(err.fieldErrors));
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed');
        toast(err instanceof Error ? err.message : 'Failed', 'error');
      }
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Extinguisher' : 'Register Extinguisher'}</h1>
        <p className="text-muted-foreground text-sm mt-1">Enter extinguisher details below</p>
      </div>

      {identityLocked && (
        <Alert>
          <AlertDescription>
            Serial number and location are locked while inspections are pending or overdue. Cancel inspections to edit identity fields.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extinguisher Details</CardTitle>
          <CardDescription>
            Installation date cannot be in the future. Expiry must be after installation
            {!isEdit && ' and cannot be in the past when registering'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              id="serialNumber"
              label="Serial Number"
              value={form.serialNumber}
              onChange={(v) => updateField('serialNumber', v)}
              maxLength={100}
              error={fieldErrors.serialNumber}
              disabled={identityLocked}
            />
            <FormField
              id="location"
              label="Location"
              value={form.location}
              onChange={(v) => updateField('location', v)}
              maxLength={255}
              error={fieldErrors.location}
              disabled={identityLocked}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select id="type" value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                  {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </Select>
                <FieldError id="type" error={fieldErrors.type} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select id="size" value={form.size} onChange={(e) => updateField('size', e.target.value)}>
                  {SIZES.map((s) => <option key={s} value={s}>{s.replace('LB_', '')} lb</option>)}
                </Select>
                <FieldError id="size" error={fieldErrors.size} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="installationDate"
                label="Installation Date"
                type="date"
                value={form.installationDate}
                onChange={(v) => updateField('installationDate', v)}
                max={todayISO()}
                error={fieldErrors.installationDate}
              />
              <FormField
                id="expiryDate"
                label="Expiry Date"
                type="date"
                value={form.expiryDate}
                onChange={(v) => updateField('expiryDate', v)}
                min={!isEdit ? todayISO() : undefined}
                error={fieldErrors.expiryDate}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={form.status}
                onChange={(e) => {
                  if (decommissionBlocked && e.target.value === 'DECOMMISSIONED') {
                    showIntegrityBlocked('Cannot decommission while active inspections exist. Cancel inspections first.');
                    return;
                  }
                  updateField('status', e.target.value);
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} disabled={decommissionBlocked && s === 'DECOMMISSIONED'}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
              {decommissionBlocked && (
                <p className="text-xs text-muted-foreground">Decommission is blocked while active inspections exist.</p>
              )}
              <FieldError id="status" error={fieldErrors.status} />
            </div>
            <Button type="submit" className="w-full">{isEdit ? 'Save Changes' : 'Register Extinguisher'}</Button>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={integrityOpen}
        title="Update blocked — data integrity"
        description={integrityMessage}
        confirmLabel="OK"
        alertOnly
        onConfirm={() => setIntegrityOpen(false)}
        onCancel={() => setIntegrityOpen(false)}
      />
    </div>
  );
}

function fieldErrorsFromApi(fieldErrors: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages.join('\n')]),
  );
}
