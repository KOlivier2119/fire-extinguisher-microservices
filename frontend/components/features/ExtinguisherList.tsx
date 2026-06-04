'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { api, ApiError, UserRole } from '@/lib/api';
import { canCreateExtinguisher, canEditExtinguisher, canDeleteExtinguisher, portalPath } from '@/lib/rbac';
import {
  ExtinguisherIntegrityFlags,
  formatIntegrityMessage,
  parseIntegrityFromApiError,
} from '@/lib/extinguisher-integrity';
import { useToast } from '@/lib/toast-context';
import { StatusBadge } from '@/lib/status-badges';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Extinguisher {
  id: string;
  serialNumber: string;
  location: string;
  type: string;
  size: string;
  status: string;
  expiryDate: string;
  integrity?: ExtinguisherIntegrityFlags;
}

interface ExtinguisherListProps {
  role: UserRole;
}

export default function ExtinguisherList({ role }: ExtinguisherListProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<Extinguisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [integrityOpen, setIntegrityOpen] = useState(false);
  const [integrityMessage, setIntegrityMessage] = useState('');
  const base = portalPath(role, '/extinguishers');
  const readOnly = !canEditExtinguisher(role);
  const canCreate = canCreateExtinguisher(role);
  const canDelete = canDeleteExtinguisher(role);

  useEffect(() => {
    api<{ data: Extinguisher[] }>('/extinguishers')
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch((err) => {
        toast(err instanceof Error ? err.message : 'Failed to load extinguishers', 'error');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const pendingItem = deleteId ? items.find((i) => i.id === deleteId) : null;

  const showIntegrityBlocked = (message: string) => {
    setIntegrityMessage(message);
    setIntegrityOpen(true);
    toast(message, 'warning');
  };

  const requestDelete = (item: Extinguisher) => {
    if (item.integrity && !item.integrity.canDelete) {
      const message = item.integrity.hasActiveInspections
        ? `Cannot delete ${item.serialNumber}: a user has scheduled inspection(s). Cancel or complete them first.`
        : `Cannot delete ${item.serialNumber}: this extinguisher is protected by data integrity rules.`;
      showIntegrityBlocked(message);
      return;
    }
    setDeleteId(item.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api(`/extinguishers/${deleteId}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast('Extinguisher deleted successfully.', 'success');
      setDeleteId(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const violations = parseIntegrityFromApiError(err.payload);
        showIntegrityBlocked(violations ? formatIntegrityMessage(violations) : err.message);
        setDeleteId(null);
      } else {
        toast(err instanceof Error ? err.message : 'Delete failed', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.serialNumber.toLowerCase().includes(search.toLowerCase())
      || i.location.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, setPage, totalPages, paginatedItems, totalItems, pageSize } = usePagination(filtered, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fire Extinguishers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {readOnly ? 'View extinguisher inventory and status' : 'Manage extinguisher inventory and data integrity'}
          </p>
        </div>
        {canCreate && (
          <Link href={`${base}/new`} className={buttonVariants()}>
            <Plus className="size-4" />
            Add Extinguisher
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Inventory</CardTitle>
          <CardDescription>Search and browse all registered extinguishers</CardDescription>
          <div className="relative max-w-sm pt-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground mt-1" />
            <Input
              placeholder="Search serial or location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No extinguishers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.serialNumber}
                          {item.integrity?.hasActiveInspections && (
                            <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400" title="Active inspections">
                              ● protected
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{item.size.replace('LB_', '')} lb</TableCell>
                        <TableCell><StatusBadge status={item.status} /></TableCell>
                        <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Link href={`${base}/${item.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                              View
                            </Link>
                            {!readOnly && (
                              <Link href={`${base}/${item.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                Edit
                              </Link>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => requestDelete(item)}>
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete extinguisher?"
        description={
          pendingItem
            ? `Are you sure you want to delete ${pendingItem.serialNumber} at ${pendingItem.location}? This action cannot be undone.`
            : 'Are you sure you want to delete this extinguisher? This action cannot be undone.'
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
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
