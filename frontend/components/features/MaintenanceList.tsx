'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Plus } from 'lucide-react';
import { api, UserRole } from '@/lib/api';
import { canLogMaintenance, canViewMaintenance, portalPath } from '@/lib/rbac';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import MaintenanceDetailsDialog, { MaintenanceRecord } from '@/components/features/MaintenanceDetailsDialog';

interface MaintenanceListProps {
  role?: UserRole;
}

export default function MaintenanceList({ role }: MaintenanceListProps) {
  const [items, setItems] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);

  useEffect(() => {
    if (role && !canViewMaintenance(role)) {
      setLoading(false);
      return;
    }
    api<{ data: MaintenanceRecord[] }>('/maintenance')
      .then((r) => setItems(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load maintenance'))
      .finally(() => setLoading(false));
  }, [role]);

  const { page, setPage, totalPages, paginatedItems, totalItems, pageSize } = usePagination(items, 8);

  const readOnly = !role || !canLogMaintenance(role);
  const showDetails = !role || canViewMaintenance(role);
  const subtitle = readOnly
    ? 'System-wide maintenance records for oversight'
    : 'Log maintenance results and review history';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance History</h1>
          <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        </div>
        {role && canLogMaintenance(role) && (
          <Link href={portalPath(role, '/maintenance/log')} className={buttonVariants()}>
            <Plus className="size-4" />
            Log Maintenance
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance Logs</CardTitle>
          <CardDescription>
            {readOnly ? 'All recorded maintenance across the system' : 'Your logged maintenance activities'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Extinguisher</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Issues</TableHead>
                    {showDetails && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={showDetails ? 5 : 4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No maintenance records
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.extinguisher?.serialNumber ?? '—'}
                        </TableCell>
                        <TableCell>{item.actionTaken}</TableCell>
                        <TableCell>{new Date(item.maintenanceDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {item.issuesIdentified?.trim() || '—'}
                        </TableCell>
                        {showDetails && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewId(item.id)}
                              aria-label={`View maintenance for ${item.extinguisher?.serialNumber ?? item.id}`}
                            >
                              <Eye className="size-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
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

      <MaintenanceDetailsDialog
        maintenanceId={viewId}
        role={role}
        onClose={() => setViewId(null)}
      />
    </div>
  );
}
