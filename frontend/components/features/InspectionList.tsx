'use client';

import { useEffect, useState } from 'react';
import { api, UserRole } from '@/lib/api';
import {
  canCancelInspection,
  canCompleteInspection,
  inspectionListSubtitle,
} from '@/lib/rbac';
import { useToast } from '@/lib/toast-context';
import { StatusBadge } from '@/lib/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

interface Inspection {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  extinguisher?: { serialNumber: string; location: string };
}

interface InspectionListProps {
  role: UserRole;
  title?: string;
}

export default function InspectionList({ role, title = 'Inspections' }: InspectionListProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<Inspection[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const showComplete = canCompleteInspection(role);
  const showCancel = canCancelInspection(role);
  const showActions = showComplete || showCancel;
  const subtitle = inspectionListSubtitle(role);

  useEffect(() => {
    const q = filter ? `?status=${filter}` : '';
    api<{ data: Inspection[] }>(`/inspections${q}`)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, [filter]);

  const { page, setPage, totalPages, paginatedItems, totalItems, pageSize } = usePagination(items, 8);

  const complete = async (id: string) => {
    try {
      await api(`/inspections/${id}/complete`, { method: 'PATCH' });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'COMPLETED' } : i)));
      toast('Inspection marked as completed.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to complete inspection', 'error');
    }
  };

  const cancel = async (id: string) => {
    try {
      await api(`/inspections/${id}/cancel`, { method: 'PATCH' });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'CANCELLED' } : i)));
      toast('Inspection cancelled.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to cancel inspection', 'error');
    }
  };

  const canActOn = (status: string) => status === 'PENDING' || status === 'OVERDUE';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Inspection Records</CardTitle>
          <CardDescription>Filter by status to narrow results</CardDescription>
          <div className="max-w-xs pt-2 space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              id="status-filter"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Extinguisher</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    {showActions && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center text-muted-foreground">
                        No inspections found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.extinguisher?.serialNumber}</TableCell>
                        <TableCell>{item.extinguisher?.location}</TableCell>
                        <TableCell>{new Date(item.scheduledDate).toLocaleDateString()}</TableCell>
                        <TableCell>{item.scheduledTime}</TableCell>
                        <TableCell><StatusBadge status={item.status} /></TableCell>
                        {showActions && (
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              {showComplete && canActOn(item.status) && (
                                <Button variant="outline" size="sm" onClick={() => complete(item.id)}>
                                  Complete
                                </Button>
                              )}
                              {showCancel && canActOn(item.status) && (
                                <Button variant="ghost" size="sm" onClick={() => cancel(item.id)}>
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
