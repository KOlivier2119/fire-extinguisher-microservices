'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Download, Package, ClipboardList, AlertTriangle, Wrench } from 'lucide-react';
import { UserRole } from '@/lib/api';
import { api, downloadReport } from '@/lib/api';
import { getReportsForRole, ReportDef } from '@/lib/rbac';
import { StatusBadge } from '@/lib/status-badges';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/toast-context';

interface ReportsPanelProps {
  role: UserRole;
}

const REPORT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  inventory: Package,
  inspections: ClipboardList,
  expired: AlertTriangle,
  maintenance: Wrench,
};

interface InventoryData {
  generatedAt?: string;
  total?: number;
  daily?: number;
  monthly?: number;
  yearly?: number;
  byStatus?: Record<string, number>;
  byType?: Record<string, number>;
}

interface InspectionStatusData {
  generatedAt?: string;
  summary?: Record<string, number>;
  items?: Record<string, unknown>[];
}

interface MaintenanceData {
  generatedAt?: string;
  total?: number;
  items?: Record<string, unknown>[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function InventoryReport({ data }: { data: InventoryData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total in Stock" value={data.total ?? 0} sub="Current inventory" />
        <StatCard label="Added Today" value={data.daily ?? 0} sub="Registered today" />
        <StatCard label="Added This Month" value={data.monthly ?? 0} sub="Registered this month" />
        <StatCard label="Added This Year" value={data.yearly ?? 0} sub="Registered this year" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.byStatus ?? {}).map(([status, count]) => (
                  <TableRow key={status}>
                    <TableCell><StatusBadge status={status} /></TableCell>
                    <TableCell className="text-right font-medium">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Type</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Type</TableHead><TableHead className="text-right">Count</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.byType ?? {}).map(([type, count]) => (
                  <TableRow key={type}>
                    <TableCell>{type.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-right font-medium">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InspectionStatusReport({ data }: { data: InspectionStatusData }) {
  const summary = data.summary ?? {};
  const items = data.items ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total" value={summary.total ?? 0} />
        <StatCard label="Pending" value={summary.PENDING ?? 0} />
        <StatCard label="Completed" value={summary.COMPLETED ?? 0} />
        <StatCard label="Overdue" value={summary.OVERDUE ?? 0} />
        <StatCard label="Cancelled" value={summary.CANCELLED ?? 0} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">All Inspections</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Extinguisher</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No inspections</TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => {
                  const ext = item.extinguisher as { serialNumber?: string; location?: string } | undefined;
                  return (
                    <TableRow key={String(item.id ?? i)}>
                      <TableCell className="font-medium">{ext?.serialNumber ?? '—'}</TableCell>
                      <TableCell>{ext?.location ?? '—'}</TableCell>
                      <TableCell>{item.scheduledDate ? new Date(String(item.scheduledDate)).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{String(item.scheduledTime ?? '—')}</TableCell>
                      <TableCell><StatusBadge status={String(item.status ?? 'PENDING')} /></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpiredReport({ items }: { items: Record<string, unknown>[] }) {
  return (
    <div className="space-y-4">
      <StatCard label="Expired Units" value={items.length} sub="Past expiry or marked expired" />
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No expired extinguishers</TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <TableRow key={String(item.id ?? i)}>
                    <TableCell className="font-medium">{String(item.serialNumber)}</TableCell>
                    <TableCell>{String(item.location)}</TableCell>
                    <TableCell>{String(item.type).replace(/_/g, ' ')}</TableCell>
                    <TableCell>{item.expiryDate ? new Date(String(item.expiryDate)).toLocaleDateString() : '—'}</TableCell>
                    <TableCell><StatusBadge status={String(item.status)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MaintenanceReport({ data }: { data: MaintenanceData }) {
  const items = data.items ?? [];
  return (
    <div className="space-y-4">
      <StatCard label="Total Records" value={data.total ?? items.length} sub="All logged maintenance" />
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Extinguisher</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Recommendations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No maintenance records</TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <TableRow key={String(item.id ?? i)}>
                    <TableCell className="font-medium">
                      {(item.extinguisher as { serialNumber?: string })?.serialNumber ?? '—'}
                    </TableCell>
                    <TableCell>{String(item.actionTaken ?? '—')}</TableCell>
                    <TableCell>
                      {item.maintenanceDate ? new Date(String(item.maintenanceDate)).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {String(item.issuesIdentified || '—')}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {String(item.recommendations || '—')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportContent({ report, data }: { report: ReportDef; data: unknown }) {
  switch (report.key) {
    case 'inventory':
      return <InventoryReport data={data as InventoryData} />;
    case 'inspections':
      return <InspectionStatusReport data={data as InspectionStatusData} />;
    case 'expired':
      return <ExpiredReport items={Array.isArray(data) ? data : []} />;
    case 'maintenance':
      return <MaintenanceReport data={data as MaintenanceData} />;
    default:
      return (
        <pre className="text-xs overflow-auto max-h-96 bg-muted/50 p-4 rounded-lg border">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
}

function getGeneratedAt(data: unknown): string | null {
  if (data && typeof data === 'object' && !Array.isArray(data) && 'generatedAt' in data) {
    return String((data as { generatedAt: string }).generatedAt);
  }
  return null;
}

export default function ReportsPanel({ role }: ReportsPanelProps) {
  const { toast } = useToast();
  const reports = getReportsForRole(role);
  const [active, setActive] = useState<ReportDef>(reports[0]);
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchReport = useCallback(async (report: ReportDef) => {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ data: unknown }>(report.path);
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load report';
      setData(null);
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (reports.length === 0) return;
    if (!reports.find((r) => r.key === active.key)) setActive(reports[0]);
  }, [reports, active.key]);

  useEffect(() => {
    if (!active) return;
    fetchReport(active);
  }, [active, fetchReport]);

  const handleDownload = async (format: 'csv' | 'pdf') => {
    setDownloading(format);
    try {
      await downloadReport(active.path, active.key, format);
      toast(`${active.label} exported as ${format.toUpperCase()}.`, 'success');
    } catch {
      setError('Download failed');
      toast('Download failed.', 'error');
    } finally {
      setDownloading(null);
    }
  };

  if (reports.length === 0) {
    return <p className="text-muted-foreground">No reports available for your role.</p>;
  }

  const generatedAt = getGeneratedAt(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Real-Time Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live system reports — refresh to update data
          </p>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {lastRefresh.toLocaleString()}
              {generatedAt && ` · Report generated: ${new Date(generatedAt).toLocaleString()}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={loading} onClick={() => fetchReport(active)}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!!downloading || loading}
            onClick={() => handleDownload('csv')}
          >
            <Download className="size-4" />
            {downloading === 'csv' ? 'Exporting...' : 'Download CSV'}
          </Button>
          <Button
            size="sm"
            disabled={!!downloading || loading}
            onClick={() => handleDownload('pdf')}
          >
            <Download className="size-4" />
            {downloading === 'pdf' ? 'Exporting...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reports.map((r) => {
          const Icon = REPORT_ICONS[r.key] ?? Package;
          const isActive = active.key === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setActive(r)}
              className={cn(
                'text-left rounded-lg border p-4 transition-all hover:border-primary/50',
                isActive ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card',
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('size-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <Badge variant={isActive ? 'default' : 'outline'} className="text-xs">{r.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{active.label}</CardTitle>
          <CardDescription>{active.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : data ? (
            <ReportContent report={active} data={data} />
          ) : (
            <p className="text-muted-foreground text-sm">No data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
