'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis,
} from 'recharts';
import {
  Package, AlertTriangle, ShieldCheck, Users, TrendingUp, Flame,
} from 'lucide-react';
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
  AdminUser,
  InventorySummary,
  buildExtinguisherStatusChart,
  buildExtinguisherTypeChart,
  buildInspectionSummaryChart,
  buildUserRoleBreakdown,
  buildUserSignupTrend,
} from '@/lib/dashboard-charts';

const signupChartConfig = {
  signups: { label: 'New Signups', color: 'var(--chart-1)' },
};

const statusChartConfig = {
  ACTIVE: { label: 'Active', color: 'var(--chart-3)' },
  EXPIRED: { label: 'Expired', color: 'var(--chart-1)' },
  UNDER_MAINTENANCE: { label: 'Maintenance', color: 'var(--chart-2)' },
  DECOMMISSIONED: { label: 'Decommissioned', color: 'var(--chart-4)' },
};

const typeChartConfig = {
  count: { label: 'Units', color: 'var(--chart-1)' },
};

const inspectionChartConfig = {
  PENDING: { label: 'Pending', color: 'var(--chart-2)' },
  COMPLETED: { label: 'Completed', color: 'var(--chart-3)' },
  OVERDUE: { label: 'Overdue', color: 'var(--chart-1)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--chart-4)' },
};

const roleChartConfig = {
  ADMIN: { label: 'Admin', color: 'var(--chart-1)' },
  INSPECTOR: { label: 'Inspector', color: 'var(--chart-4)' },
  USER: { label: 'Client', color: 'var(--chart-2)' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [inspectionSummary, setInspectionSummary] = useState<Record<string, number>>({});
  const [complianceRate, setComplianceRate] = useState<number | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    Promise.all([
      api<{ data: AdminUser[] }>('/users').catch(() => null),
      api<{ data: InventorySummary }>('/reports/inventory/summary').catch(() => null),
      api<{ data: { summary?: Record<string, number> } }>('/reports/inspections/status').catch(() => null),
      api<{ data: { complianceRate?: number } }>('/reports/compliance/status').catch(() => null),
      api<{ data: unknown[] }>('/reports/inspections/overdue').catch(() => null),
    ]).then(([usersRes, inv, insp, compliance, overdue]) => {
      setUsers(usersRes?.data ?? []);
      setInventory(inv?.data ?? null);
      setInspectionSummary(insp?.data?.summary ?? {});
      setComplianceRate(compliance?.data?.complianceRate ?? null);
      setOverdueCount(Array.isArray(overdue?.data) ? overdue.data.length : 0);
      setLoading(false);
    });
  }, []);

  const signupTrend = useMemo(() => buildUserSignupTrend(users), [users]);
  const roleBreakdown = useMemo(() => buildUserRoleBreakdown(users), [users]);
  const statusChart = useMemo(
    () => buildExtinguisherStatusChart(inventory?.byStatus),
    [inventory],
  );
  const typeChart = useMemo(
    () => buildExtinguisherTypeChart(inventory?.byType),
    [inventory],
  );
  const inspectionChart = useMemo(
    () => buildInspectionSummaryChart(inspectionSummary),
    [inspectionSummary],
  );

  const activeCount = inventory?.byStatus?.ACTIVE ?? 0;
  const totalExtinguishers = inventory?.total ?? 0;
  const totalSignupsThisMonth = signupTrend.at(-1)?.signups ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="destructive" className="mb-2">Admin Portal</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName}. Live fleet inventory, user growth, and compliance at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users" className={buttonVariants({ size: 'sm' })}>Manage Users</Link>
          <Link href="/admin/reports" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Reports</Link>
          <Link href="/admin/extinguishers/new" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>Add Extinguisher</Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available (Active)', value: activeCount, icon: Flame, color: 'text-emerald-600 bg-emerald-50', sub: `${totalExtinguishers} total in stock` },
          { label: 'Registered Users', value: users.length, icon: Users, color: 'text-sky-600 bg-sky-50', sub: `${totalSignupsThisMonth} new this month` },
          { label: 'Compliance Rate', value: complianceRate != null ? `${complianceRate}%` : '—', icon: ShieldCheck, color: 'text-primary bg-primary/10', sub: 'Active vs total fleet' },
          { label: 'Overdue Inspections', value: overdueCount, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', sub: 'Requires attention' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`rounded-lg p-2 ${color}`}><Icon className="size-4" /></div>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <>
                  <p className="text-3xl font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1: User growth + Role mix */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle className="text-base">User Signups</CardTitle>
            </div>
            <CardDescription>New account registrations over the last 6 months (from user records)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : signupTrend.every((d) => d.signups === 0) ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No signup activity in the last 6 months yet.
              </div>
            ) : (
              <ChartContainer config={signupChartConfig} className="h-[280px] w-full aspect-auto">
                <AreaChart data={signupTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-signups)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-signups)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="var(--color-signups)"
                    strokeWidth={2}
                    fill="url(#signupFill)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by Role</CardTitle>
            <CardDescription>Current account distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : roleBreakdown.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No users</div>
            ) : (
              <ChartContainer config={roleChartConfig} className="h-[280px] w-full aspect-auto">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" hideIndicator />} />
                  <Pie
                    data={roleBreakdown}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    strokeWidth={2}
                  >
                    {roleBreakdown.map((entry) => (
                      <Cell key={entry.role} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                {users.length}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-xs">
                                users
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
      </div>

      {/* Charts row 2: Extinguisher fleet */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="size-4 text-primary" />
              <CardTitle className="text-base">Extinguisher Availability</CardTitle>
            </div>
            <CardDescription>
              Fleet status breakdown — {activeCount} units ready for deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : statusChart.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No extinguishers registered</div>
            ) : (
              <ChartContainer config={statusChartConfig} className="h-[280px] w-full aspect-auto">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                  <Pie
                    data={statusChart}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {statusChart.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="label" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory by Extinguisher Type</CardTitle>
            <CardDescription>
              Stock levels across agent types (CO₂, foam, water, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : typeChart.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No inventory data</div>
            ) : (
              <ChartContainer config={typeChartConfig} className="h-[280px] w-full aspect-auto">
                <BarChart data={typeChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={22} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inspection pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inspection Pipeline</CardTitle>
          <CardDescription>Live inspection workload across all statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ChartContainer config={inspectionChartConfig} className="h-[220px] w-full aspect-auto">
              <BarChart data={inspectionChart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={48}>
                  {inspectionChart.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Stock registration velocity */}
      {!loading && inventory && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Added Today', value: inventory.daily ?? 0 },
            { label: 'Added This Month', value: inventory.monthly ?? 0 },
            { label: 'Added This Year', value: inventory.yearly ?? 0 },
          ].map(({ label, value }) => (
            <Card key={label} className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">New extinguisher registrations</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
