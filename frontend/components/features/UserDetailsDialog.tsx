'use client';

import { useEffect, useState } from 'react';
import { Mail, Shield, User as UserIcon, X } from 'lucide-react';
import { api, User, UserRole } from '@/lib/api';
import { RoleBadge } from '@/lib/status-badges';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface UserDetailsDialogProps {
  userId: string | null;
  currentUserId?: string;
  onClose: () => void;
  onRoleUpdated: (user: User) => void;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium break-all">{value}</div>
      </div>
    </div>
  );
}

export default function UserDetailsDialog({ userId, currentUserId, onClose, onRoleUpdated }: UserDetailsDialogProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('USER');
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setUser(null);
      return;
    }

    setLoading(true);
    setError('');
    api<{ data: User }>(`/users/${userId}`)
      .then((res) => {
        setUser(res.data);
        setRole(res.data.role);
      })
      .catch((err) => {
        setUser(null);
        setError(err instanceof Error ? err.message : 'Failed to load user');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const isSelf = userId === currentUserId;

  const saveRole = async () => {
    if (!user || role === user.role) return;
    setSavingRole(true);
    setError('');
    try {
      const res = await api<{ data: User }>(`/users/${user.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      setUser(res.data);
      onRoleUpdated(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      setRole(user.role);
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-details-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="user-details-title" className="text-lg font-semibold">User details</h2>
            <p className="text-sm text-muted-foreground mt-1">Account information and role</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error && !user ? (
          <p className="mt-6 text-sm text-destructive">{error}</p>
        ) : user ? (
          <div className="mt-6 space-y-4">
            <div className="divide-y">
              <DetailRow
                label="Name"
                value={`${user.firstName} ${user.lastName}`}
                icon={UserIcon}
              />
              <DetailRow label="Email" value={user.email} icon={Mail} />
              <DetailRow label="Current role" value={<RoleBadge role={user.role} />} icon={Shield} />
              <DetailRow label="Member since" value={formatDate(user.createdAt)} icon={Shield} />
            </div>

            <Separator />

            <div className="space-y-2">
              <label htmlFor="details-role" className="text-sm font-medium">
                Assign role
              </label>
              <Select
                id="details-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full"
                disabled={isSelf}
              >
                <option value="USER">USER</option>
                <option value="INSPECTOR">INSPECTOR</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
              {isSelf && (
                <p className="text-xs text-muted-foreground">
                  You cannot change your own role. Ask another admin if needed.
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="button"
                className="w-full"
                disabled={savingRole || role === user.role || isSelf}
                onClick={saveRole}
              >
                {savingRole ? 'Saving...' : 'Save role'}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
}
