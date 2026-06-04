import { UserRole } from './api';

export const PORTAL_HOME: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  INSPECTOR: '/inspector/dashboard',
  USER: '/user/dashboard',
};

export const PORTAL_PREFIX: Record<UserRole, string> = {
  ADMIN: '/admin',
  INSPECTOR: '/inspector',
  USER: '/user',
};

export const PORTAL_TITLE: Record<UserRole, string> = {
  ADMIN: 'Admin Portal',
  INSPECTOR: 'Inspector Portal',
  USER: 'Client Portal',
};

export interface NavItem {
  href: string;
  label: string;
}

export interface ReportDef {
  key: string;
  label: string;
  path: string;
  description: string;
}

export const ADMIN_REPORTS: ReportDef[] = [
  {
    key: 'inventory',
    label: 'Extinguisher Stock',
    path: '/reports/inventory/summary',
    description: 'Total extinguishers in stock with daily, monthly, and yearly registration trends',
  },
  {
    key: 'inspections',
    label: 'Inspection Status',
    path: '/reports/inspections/status',
    description: 'Real-time breakdown of pending, completed, overdue, and cancelled inspections',
  },
  {
    key: 'expired',
    label: 'Expired Extinguishers',
    path: '/reports/compliance/expired',
    description: 'Extinguishers past expiry date or marked expired',
  },
  {
    key: 'maintenance',
    label: 'Maintenance History',
    path: '/reports/maintenance/history',
    description: 'Complete log of all maintenance activities',
  },
];

/** @deprecated use ADMIN_REPORTS */
export const ALL_REPORTS: ReportDef[] = ADMIN_REPORTS;

export function getReportsForRole(role: UserRole): ReportDef[] {
  if (role === 'ADMIN') return ADMIN_REPORTS;
  return [];
}

function nav(role: UserRole, items: { segment: string; label: string }[]): NavItem[] {
  const prefix = PORTAL_PREFIX[role];
  return items.map(({ segment, label }) => ({ href: `${prefix}${segment}`, label }));
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  ADMIN: nav('ADMIN', [
    { segment: '/dashboard', label: 'Dashboard' },
    { segment: '/users', label: 'Users' },
    { segment: '/extinguishers', label: 'Extinguishers' },
    { segment: '/inspections', label: 'Inspections' },
    { segment: '/maintenance', label: 'Maintenance' },
    { segment: '/reports', label: 'Reports' },
    { segment: '/profile', label: 'Profile' },
  ]),
  INSPECTOR: nav('INSPECTOR', [
    { segment: '/dashboard', label: 'Dashboard' },
    { segment: '/extinguishers', label: 'Extinguishers' },
    { segment: '/inspections', label: 'Inspections' },
    { segment: '/maintenance', label: 'Maintenance' },
    { segment: '/profile', label: 'Profile' },
  ]),
  USER: nav('USER', [
    { segment: '/dashboard', label: 'Dashboard' },
    { segment: '/extinguishers', label: 'Extinguishers' },
    { segment: '/inspections', label: 'My Inspections' },
    { segment: '/inspections/schedule', label: 'Schedule' },
    { segment: '/profile', label: 'Profile' },
  ]),
};

export function portalPath(role: UserRole, segment: string): string {
  return `${PORTAL_PREFIX[role]}${segment.startsWith('/') ? segment : `/${segment}`}`;
};

export function canCreateExtinguisher(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canEditExtinguisher(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canDeleteExtinguisher(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canScheduleInspection(role: UserRole): boolean {
  return role === 'USER';
}

export function canCompleteInspection(role: UserRole): boolean {
  return role === 'INSPECTOR';
}

export function canCancelInspection(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'INSPECTOR' || role === 'USER';
}

export function canLogMaintenance(role: UserRole): boolean {
  return role === 'INSPECTOR';
}

export function canViewMaintenance(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'INSPECTOR';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canViewReports(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function inspectionListSubtitle(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'System-wide oversight of all inspection records';
    case 'INSPECTOR':
      return 'Complete assigned inspections and log results';
    case 'USER':
      return 'Track your scheduled inspection requests';
    default:
      return 'Inspection records';
  }
}

/** Map legacy paths to portal-relative segments */
export function legacyRedirect(role: UserRole, pathname: string): string | null {
  const home = PORTAL_HOME[role];
  const prefix = PORTAL_PREFIX[role];

  if (pathname === '/dashboard' || pathname === '/admin') return home;

  if (role === 'USER') {
    if (pathname.startsWith('/maintenance') || pathname.startsWith('/reports')) return home;
    if (pathname.includes('/edit')) {
      const viewPath = pathname.replace(/\/edit$/, '');
      if (viewPath.startsWith('/extinguishers')) {
        return `${prefix}${viewPath}`;
      }
      return home;
    }
  }

  if (role === 'INSPECTOR') {
    if (pathname.startsWith('/reports')) return home;
    if (pathname === '/extinguishers/new' || pathname.endsWith('/edit')) {
      return `${prefix}/extinguishers`;
    }
    if (pathname.startsWith('/inspections/schedule')) {
      return `${prefix}/inspections`;
    }
  }

  if (role === 'ADMIN' && pathname.startsWith('/maintenance/log')) {
    return `${prefix}/maintenance`;
  }

  const legacyMap: Record<string, string> = {
    '/extinguishers': '/extinguishers',
    '/inspections': '/inspections',
    '/inspections/schedule': role === 'USER' ? '/inspections/schedule' : '/inspections',
    '/maintenance': role === 'USER' ? home : '/maintenance',
    '/maintenance/log': role === 'INSPECTOR' ? '/maintenance/log' : home,
    '/reports': role === 'ADMIN' ? '/reports' : home,
    '/profile': '/profile',
    '/admin/users': role === 'ADMIN' ? '/users' : home,
  };

  for (const [legacy, segment] of Object.entries(legacyMap)) {
    if (pathname === legacy || pathname.startsWith(`${legacy}/`)) {
      const rest = pathname.slice(legacy.length);
      if (segment === home) return home;
      return `${prefix}${segment}${rest}`;
    }
  }

  return null;
}
