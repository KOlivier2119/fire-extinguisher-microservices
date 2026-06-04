'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flame, LayoutDashboard, Users, Package, ClipboardList, Wrench, BarChart3,
  UserCircle, CalendarPlus, LogOut, ChevronRight, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NAV_BY_ROLE, PORTAL_PREFIX, PORTAL_TITLE } from '@/lib/rbac';
import { RoleBadge } from '@/lib/status-badges';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import ConfirmDialog from '@/components/ConfirmDialog';

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Users: Users,
  Extinguishers: Package,
  Inspections: ClipboardList,
  'My Inspections': ClipboardList,
  Schedule: CalendarPlus,
  Maintenance: Wrench,
  'Log Maintenance': Wrench,
  Reports: BarChart3,
  Profile: UserCircle,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAuthPage = ['/login', '/register', '/forgot-password', '/verify-reset-otp', '/reset-password'].includes(pathname);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="space-y-3 w-48">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user || isAuthPage) return <>{children}</>;

  const navItems = NAV_BY_ROLE[user.role];
  const portalTitle = PORTAL_TITLE[user.role];
  const profileHref = `${PORTAL_PREFIX[user.role]}/profile`;
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  const sidebarContent = (
    <>
      <div className="shrink-0 p-4 sm:p-5 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Flame className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight truncate">TZW LTD FEMS</h1>
              <Badge variant="outline" className="mt-1 border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground text-[10px] px-1.5 py-0">
                {portalTitle}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden text-sidebar-foreground shrink-0"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.label] ?? ChevronRight;
          const active = pathname === item.href
            || (item.href !== navItems[0]?.href && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0 opacity-90" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 p-4 border-t border-sidebar-border">
        <Link
          href={profileHref}
          onClick={() => setMobileNavOpen(false)}
          className="flex items-center gap-3 mb-3 rounded-lg p-1 -m-1 transition-colors hover:bg-sidebar-accent"
        >
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
            <RoleBadge
              role={user.role}
              className="mt-0.5 border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground text-[10px]"
            />
          </div>
        </Link>
        <Separator className="mb-3 bg-sidebar-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLogoutOpen(true)}
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="h-svh overflow-hidden bg-muted/40">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-svh w-[min(100vw,16rem)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
          'transition-transform duration-200 ease-out lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebarContent}
      </aside>

      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        description="You will be returned to the login page. Any unsaved changes may be lost."
        confirmLabel="Sign out"
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
        }}
        onCancel={() => setLogoutOpen(false)}
      />

      <div className="flex h-svh min-w-0 flex-col lg:pl-64">
        <header className="flex lg:hidden h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">TZW LTD FEMS</p>
            <p className="text-xs text-muted-foreground truncate">{portalTitle}</p>
          </div>
          <Link href={profileHref} className="shrink-0" aria-label="Profile">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto min-h-full w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
