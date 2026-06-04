'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, UserRole } from '@/lib/api';
import { portalPath } from '@/lib/rbac';
import { todayISO } from '@/lib/date-utils';
import { inspectionSchema } from '@/lib/extinguisher-schemas';
import { zodFieldErrors } from '@/lib/zod-utils';
import { useToast } from '@/lib/toast-context';
import FormField, { FieldError } from '@/components/FormField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Extinguisher { id: string; serialNumber: string; location: string }
interface Inspector { id: string; email: string; firstName: string; lastName: string }

interface ScheduleInspectionFormProps {
  role: UserRole;
}

const INITIAL_FORM = {
  extinguisherId: '',
  scheduledDate: '',
  scheduledTime: '09:00',
  assignedInspectorId: '',
  assignedInspectorEmail: '',
  notes: '',
};

export default function ScheduleInspectionForm({ role }: ScheduleInspectionFormProps) {
  const { toast } = useToast();
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const inspectionsPath = portalPath(role, '/inspections');

  useEffect(() => {
    api<{ data: Extinguisher[] }>('/extinguishers').then((r) => setExtinguishers(r.data));
    api<{ data: Inspector[] }>('/users/inspectors').then((r) => setInspectors(r.data));
  }, []);

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
    setScheduled(false);
    clearFieldError(field);
  };

  const handleInspectorChange = (id: string) => {
    const insp = inspectors.find((i) => i.id === id);
    setForm((prev) => ({
      ...prev,
      assignedInspectorId: id,
      assignedInspectorEmail: insp?.email || '',
    }));
    setScheduled(false);
    clearFieldError('assignedInspectorId');
    clearFieldError('assignedInspectorEmail');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setScheduled(false);

    const parsed = inspectionSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      await api('/inspections', { method: 'POST', body: JSON.stringify(parsed.data) });
      setForm(INITIAL_FORM);
      setScheduled(true);
      toast('Inspection scheduled successfully. The assigned inspector will be notified by email.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule inspection';
      setError(message);
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule Inspection</h1>
        <p className="text-muted-foreground text-sm mt-1">Request an inspection for your extinguisher</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspection Details</CardTitle>
          <CardDescription>
            Schedule a future date and time between 06:00 and 20:00. An email will be sent to the assigned inspector.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduled && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>
                Inspection scheduled successfully. You can schedule another below or{' '}
                <Link href={inspectionsPath} className="font-medium underline">
                  view your inspections
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label>Extinguisher</Label>
              <Select value={form.extinguisherId} onChange={(e) => updateField('extinguisherId', e.target.value)}>
                <option value="">Select extinguisher</option>
                {extinguishers.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.serialNumber} — {ex.location}</option>
                ))}
              </Select>
              <FieldError id="extinguisherId" error={fieldErrors.extinguisherId} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="scheduledDate"
                label="Date"
                type="date"
                value={form.scheduledDate}
                onChange={(v) => updateField('scheduledDate', v)}
                min={todayISO()}
                error={fieldErrors.scheduledDate}
              />
              <FormField
                id="scheduledTime"
                label="Time"
                type="time"
                value={form.scheduledTime}
                onChange={(v) => updateField('scheduledTime', v)}
                min="06:00"
                max="20:00"
                error={fieldErrors.scheduledTime}
              />
            </div>
            <div className="space-y-2">
              <Label>Inspector</Label>
              <Select value={form.assignedInspectorId} onChange={(e) => handleInspectorChange(e.target.value)}>
                <option value="">Select inspector</option>
                {inspectors.map((i) => (
                  <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                ))}
              </Select>
              <FieldError id="assignedInspectorId" error={fieldErrors.assignedInspectorId || fieldErrors.assignedInspectorEmail} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} maxLength={1000} />
              <FieldError id="notes" error={fieldErrors.notes} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Scheduling...' : 'Schedule Inspection'}
              </Button>
              <Link href={inspectionsPath} className={buttonVariants({ variant: 'outline', className: 'flex-1' })}>
                View inspections
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
