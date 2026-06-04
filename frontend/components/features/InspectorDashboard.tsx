'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, ClipboardList, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import {
  buildInspectionStatusChart,
  buildUpcomingInspectionWeek,
  summarizeInspectionStatuses,
} from '@/lib/dashboard-charts';

interface Inspection {
  id: string;
  status: string;
  scheduledDate: string;
}

const inspectionChartConfig = {
  PENDING: { label: 'Pending', color: 'var(--chart-2)' },
  COMPLETED: { label: 'Completed', color: 'var(--chart-3)' },
  OVERDUE: { label: 'Overdue', color: 'var(--chart-1)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--chart-4)' },
};

const weekChartConfig = {
  count: { label: 'Inspections', color: 'var(--chart-1)' },
};

export default function InspectorDashboard() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ data: Inspection[] }>('/inspections').catch(() => null),
      api<{ data: unknown[] }>('/maintenance').catch(() => null),
    ]).then(([insp, maint]) => {
      setInspections(insp?.data ?? []);
      setMaintenanceCount(Array.isArray(maint?.data) ? maint.data.length : 0);
      setLoading(false);
    });
  }, []);

  const statusCounts = useMemo(
    () => summarizeInspectionStatuses(inspections),
    [inspections],
  );

  const inspectionChart = useMemo(
    () => buildInspectionStatusChart(inspections),
    [inspections],
  );

  const weekChart = useMemo(
    () => buildUpcomingInspectionWeek(inspections),
    [inspections],
  );

  const totalAssigned = inspections.length;
  const upcomingThisWeek = weekChart.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="info" className="mb-2">Inspector Portal</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Inspector Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {user?.firstName}. Your assigned work at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/inspector/inspections" className={buttonVariants({ size: 'sm' })}>
            View Inspections
          </Link>
          <Link href="/inspector/maintenance/log" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Log Maintenance
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: statusCounts.PENDING ?? 0, icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
          { label: 'Overdue', value: statusCounts.OVERDUE ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Completed', value: statusCounts.COMPLETED ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Maintenance Logs', value: maintenanceCount, icon: Wrench, color: 'text-sky-600 bg-sky-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`rounded-lg p-2 ${color}`}><Icon className="size-4" /></div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-12" /> : (
                <p className="text-3xl font-bold tabular-nums">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Inspections</CardTitle>
            <CardDescription>
              {loading ? 'Loading…' : `${totalAssigned} assigned · ${upcomingThisWeek} due this week`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : inspectionChart.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No assigned inspections yet.
              </div>
            ) : (
              <ChartContainer config={inspectionChartConfig} className="h-[240px] w-full aspect-auto">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" hideIndicator />} />
                  <Pie
                    data={inspectionChart}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={2}
                  >
                    {inspectionChart.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                {totalAssigned}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-xs">
                                total
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Week</CardTitle>
            <CardDescription>Pending and overdue inspections by day</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : upcomingThisWeek === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                Nothing scheduled for the next 7 days.
              </div>
            ) : (
              <ChartContainer config={weekChartConfig} className="h-[240px] w-full aspect-auto">
                <BarChart data={weekChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload as { date?: string; day?: string } | undefined;
                          return row ? `${row.day} · ${row.date}` : '';
                        }}
                      />
                    }
                  />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/inspector/extinguishers" className={buttonVariants({ variant: 'secondary' })}>
          View Extinguishers
        </Link>
        <Link href="/inspector/maintenance" className={buttonVariants({ variant: 'outline' })}>
          Maintenance History
        </Link>
      </div>
    </div>
  );
}
