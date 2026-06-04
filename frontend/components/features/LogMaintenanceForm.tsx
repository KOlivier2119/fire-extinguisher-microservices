'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, UserRole } from '@/lib/api';
import { portalPath } from '@/lib/rbac';
import { todayISO } from '@/lib/date-utils';
import { maintenanceSchemaWithInstallDate } from '@/lib/extinguisher-schemas';
import { zodFieldErrors } from '@/lib/zod-utils';
import { useToast } from '@/lib/toast-context';
import FormField, { FieldError } from '@/components/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Extinguisher {
  id: string;
  serialNumber: string;
  installationDate: string;
}

interface LogMaintenanceFormProps {
  role: UserRole;
}

const INITIAL_FORM = {
  extinguisherId: '',
  actionTaken: '',
  maintenanceDate: '',
  issuesIdentified: '',
  notes: '',
  recommendations: '',
};

export default function LogMaintenanceForm({ role }: LogMaintenanceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ data: Extinguisher[] }>('/extinguishers').then((r) => setExtinguishers(r.data));
  }, []);

  const selectedExtinguisher = useMemo(
    () => extinguishers.find((ex) => ex.id === form.extinguisherId),
    [extinguishers, form.extinguisherId],
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const schema = maintenanceSchemaWithInstallDate(selectedExtinguisher?.installationDate);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await api('/maintenance', { method: 'POST', body: JSON.stringify(parsed.data) });
      setForm(INITIAL_FORM);
      toast('Maintenance logged successfully.', 'success');
      router.push(portalPath(role, '/maintenance'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log maintenance';
      setError(message);
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Maintenance</h1>
        <p className="text-muted-foreground text-sm mt-1">Record maintenance activity for an extinguisher</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance Record</CardTitle>
          <CardDescription>
            Maintenance date must be today or in the past, and on or after the extinguisher installation date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label>Extinguisher</Label>
              <Select
                value={form.extinguisherId}
                onChange={(e) => updateField('extinguisherId', e.target.value)}
              >
                <option value="">Select extinguisher</option>
                {extinguishers.map((ex) => <option key={ex.id} value={ex.id}>{ex.serialNumber}</option>)}
              </Select>
              <FieldError id="extinguisherId" error={fieldErrors.extinguisherId} />
            </div>
            <FormField
              id="actionTaken"
              label="Action Taken"
              value={form.actionTaken}
              onChange={(v) => updateField('actionTaken', v)}
              maxLength={500}
              error={fieldErrors.actionTaken}
            />
            <FormField
              id="maintenanceDate"
              label="Maintenance Date"
              type="date"
              value={form.maintenanceDate}
              onChange={(v) => updateField('maintenanceDate', v)}
              max={todayISO()}
              min={selectedExtinguisher?.installationDate?.slice(0, 10)}
              error={fieldErrors.maintenanceDate}
            />
            <div className="space-y-2">
              <Label>Issues Identified</Label>
              <Textarea
                value={form.issuesIdentified}
                onChange={(e) => updateField('issuesIdentified', e.target.value)}
                rows={2}
                maxLength={1000}
              />
              <FieldError id="issuesIdentified" error={fieldErrors.issuesIdentified} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={2} maxLength={1000} />
              <FieldError id="notes" error={fieldErrors.notes} />
            </div>
            <div className="space-y-2">
              <Label>Recommendations</Label>
              <Textarea value={form.recommendations} onChange={(e) => updateField('recommendations', e.target.value)} rows={2} maxLength={1000} />
              <FieldError id="recommendations" error={fieldErrors.recommendations} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving...' : 'Log Maintenance'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
